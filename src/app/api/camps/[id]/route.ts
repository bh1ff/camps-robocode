import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

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
      }[];
    }> = {};

    for (const group of camp.groups) {
      groups[group.name] = {
        ageRange: group.ageRange,
        color: group.color,
        kids: group.children.map((child) => ({
          id: child.id,
          name: `${child.firstName} ${child.lastName}`,
          age: child.age,
          allergies: child.allergyDetails || '',
          hasSEND: child.hasSEND,
          hasEHCP: child.hasEHCP,
          checkedIn: false,
          checkedOut: false,
          attended: child.attendances.map((a) => `session-${a.session.order}`),
        })),
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
