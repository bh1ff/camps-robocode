import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const camps = await prisma.camp.findMany({
      include: {
        location: { select: { name: true } },
        season: { select: { title: true } },
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
        },
        sessions: { orderBy: { order: 'asc' } },
      },
      orderBy: { startDate: 'asc' },
    });

    const campStats = camps.map((camp) => {
      const allKids = camp.groups.flatMap((g) => g.children);
      const checkedIn = allKids.filter((k) => k.dayBookings.some((db) => db.checkedIn)).length;
      const checkedOut = allKids.filter((k) => k.dayBookings.some((db) => db.checkedOut)).length;

      const sessionStats = camp.sessions.map((session) => {
        const attended = allKids.filter((k) =>
          k.attendances.some((a) => a.sessionId === session.id && a.attended)
        ).length;
        return {
          id: session.id,
          name: session.name,
          time: session.time,
          attended,
        };
      });

      const groupStats = camp.groups.map((g) => ({
        name: g.name,
        color: g.color,
        ageRange: g.ageRange,
        total: g.children.length,
        checkedIn: g.children.filter((k) => k.dayBookings.some((db) => db.checkedIn)).length,
      }));

      return {
        id: camp.id,
        name: camp.name,
        date: camp.startDate,
        location: camp.location?.name || 'Unknown',
        season: camp.season?.title || 'Unknown',
        totalKids: allKids.length,
        checkedIn,
        checkedOut,
        sessions: sessionStats,
        groups: groupStats,
      };
    });

    return NextResponse.json(campStats);
  } catch (error) {
    console.error('Extract data error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
