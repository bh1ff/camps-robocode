import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

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
      include: { group: true, session: true, area: true },
    });

    if (format === 'csv') {
      const rows: string[] = [];
      rows.push('Name,Age,Group,Allergies,Checked In,Checked Out,' +
        camp.sessions.map(s => s.name).join(','));

      for (const group of camp.groups) {
        for (const child of group.children) {
          const dayBooking = child.dayBookings[0];
          const attendances = camp.sessions.map(session => {
            const att = child.attendances.find(a => a.sessionId === session.id);
            return att ? 'Yes' : 'No';
          });

          rows.push([
            `"${child.firstName} ${child.lastName}"`,
            child.age,
            group.name,
            `"${child.allergyDetails || ''}"`,
            dayBooking?.checkedIn ? 'Yes' : 'No',
            dayBooking?.checkedOut ? 'Yes' : 'No',
            ...attendances,
          ].join(','));
        }
      }

      return new NextResponse(rows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${camp.name.replace(/[^a-z0-9]/gi, '_')}_export.csv"`,
        },
      });
    }

    const exportData = {
      camp: {
        name: camp.name,
        description: camp.description,
        startDate: camp.startDate,
        endDate: camp.endDate,
        lunchTime: camp.lunchTime,
      },
      sessions: camp.sessions.map(s => ({
        name: s.name, time: s.time, order: s.order,
      })),
      areas: camp.areas.map(a => ({ name: a.name, type: a.type })),
      groups: camp.groups.map(g => ({
        name: g.name,
        ageRange: g.ageRange,
        kids: g.children.map(c => {
          const db = c.dayBookings[0];
          return {
            name: `${c.firstName} ${c.lastName}`,
            age: c.age,
            allergies: c.allergyDetails,
            checkedIn: db?.checkedIn ?? false,
            checkedOut: db?.checkedOut ?? false,
            attendance: c.attendances.map(a => ({
              session: a.session.name,
              attended: a.attended,
            })),
          };
        }),
      })),
      schedule: scheduleSlots.map(s => ({
        group: s.group.name,
        session: s.session.name,
        area: s.area.name,
      })),
      exportedAt: new Date().toISOString(),
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
