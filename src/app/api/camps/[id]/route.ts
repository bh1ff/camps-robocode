import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Wristband colour per group
const GROUP_WRISTBAND: Record<string, string> = {
  A: 'purple',
  B: 'orange',
  C: 'pink',
  D: 'green',
  E: 'red',
  F: 'yellow',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campId } = await params;

    const camp = await prisma.camp.findUnique({
      where: { id: campId },
      include: {
        groups: {
          include: {
            children: {
              include: {
                attendances: {
                  include: { session: true },
                },
                dayBookings: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        },
        areas: true,
        sessions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!camp) {
      return NextResponse.json({ error: 'Camp not found' }, { status: 404 });
    }

    // Find sibling day-camps (same location & season) to determine each kid's booked days
    let siblingCamps: { id: string; name: string; startDate: Date }[] = [];
    if (camp.locationId && camp.seasonId) {
      siblingCamps = await prisma.camp.findMany({
        where: { locationId: camp.locationId, seasonId: camp.seasonId },
        select: { id: true, name: true, startDate: true },
        orderBy: { startDate: 'asc' },
      });
    }

    // Build a map of childName → day labels across all sibling camps
    const childDaysMap: Record<string, string[]> = {};
    if (siblingCamps.length > 1) {
      const allSiblingGroups = await prisma.group.findMany({
        where: { campId: { in: siblingCamps.map((c) => c.id) } },
        include: {
          children: { select: { firstName: true, lastName: true, age: true } },
          camp: { select: { id: true, name: true } },
        },
      });

      for (const group of allSiblingGroups) {
        // Extract day label from camp name e.g. "Shirley - Monday" → "Mon"
        const campName = group.camp.name;
        const dayMatch = campName.match(/(Monday|Tuesday|Wednesday|Thursday|Friday)/i);
        const dayLabel = dayMatch ? dayMatch[1].slice(0, 3) : campName;

        for (const child of group.children) {
          const key = `${child.firstName} ${child.lastName}`.toLowerCase();
          if (!childDaysMap[key]) childDaysMap[key] = [];
          if (!childDaysMap[key].includes(dayLabel)) {
            childDaysMap[key].push(dayLabel);
          }
        }
      }
    }

    const scheduleSlots = await prisma.scheduleSlot.findMany({
      where: { group: { campId } },
      include: {
        group: true,
        session: true,
        area: true,
      },
    });

    const groups: Record<string, {
      ageRange: string;
      color: string;
      kids: {
        id: string;
        name: string;
        age: number;
        allergies: string;
        hasSEND: boolean;
        hasEHCP: boolean;
        checkedIn: boolean;
        checkedOut: boolean;
        attended: string[];
        days: string[];
      }[];
    }> = {};

    for (const group of camp.groups) {
      groups[group.name] = {
        ageRange: group.ageRange,
        color: GROUP_WRISTBAND[group.name] || group.color,
        kids: group.children.map((child) => {
          const dayBooking = child.dayBookings[0];
          const fullName = `${child.firstName} ${child.lastName}`;
          const days = childDaysMap[fullName.toLowerCase()] || [];
          return {
            id: child.id,
            name: fullName,
            age: child.age,
            allergies: child.allergyDetails || '',
            hasSEND: child.hasSEND,
            hasEHCP: child.hasEHCP,
            checkedIn: dayBooking?.checkedIn ?? false,
            checkedOut: dayBooking?.checkedOut ?? false,
            attended: child.attendances.map((a) => `session-${a.session.order}`),
            days,
          };
        }),
      };
    }

    const rotation: Record<string, string[]> = {};
    for (const group of camp.groups) {
      const groupSlots = scheduleSlots
        .filter((s) => s.groupId === group.id)
        .sort((a, b) => a.session.order - b.session.order);
      rotation[group.name] = groupSlots.map((s) => s.area.id);
    }

    const data = {
      groups,
      schedule: {
        sessions: camp.sessions.map((s) => ({
          id: s.id,
          name: s.name,
          time: s.time,
        })),
        areas: camp.areas.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
        })),
        rotation,
        lunch: { time: camp.lunchTime },
      },
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Get camp data error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
