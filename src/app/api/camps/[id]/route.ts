import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Get camp data for dashboard/teacher views
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
            kids: {
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

    // Get schedule slots
    const scheduleSlots = await prisma.scheduleSlot.findMany({
      where: { group: { campId } },
      include: {
        group: true,
        session: true,
        area: true,
      },
    });

    // Transform to the format expected by frontend
    const groups: Record<string, {
      ageRange: string;
      kids: {
        id: string;
        name: string;
        age: number;
        allergies: string;
        checkedIn: boolean;
        checkedOut: boolean;
        attended: string[];
      }[];
    }> = {};

    for (const group of camp.groups) {
      groups[group.name] = {
        ageRange: group.ageRange,
        kids: group.kids.map((kid: { id: string; name: string; age: number; allergies: string | null; checkedIn: boolean; checkedOut: boolean; attendances: { session: { order: number } }[] }) => ({
          id: kid.id,
          name: kid.name,
          age: kid.age,
          allergies: kid.allergies || '',
          checkedIn: kid.checkedIn,
          checkedOut: kid.checkedOut,
          attended: kid.attendances.map((a: { session: { order: number } }) => `session-${a.session.order}`),
        })),
      };
    }

    // Build rotation schedule
    const rotation: Record<string, string[]> = {};
    for (const group of camp.groups) {
      const groupSlots = scheduleSlots
        .filter(s => s.groupId === group.id)
        .sort((a, b) => a.session.order - b.session.order);
      rotation[group.name] = groupSlots.map((s: { area: { id: string } }) => s.area.id);
    }

    const data = {
      groups,
      schedule: {
        sessions: camp.sessions.map((s: { id: string; name: string; time: string }) => ({
          id: s.id,
          name: s.name,
          time: s.time,
        })),
        areas: camp.areas.map((a: { id: string; name: string; type: string }) => ({
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
