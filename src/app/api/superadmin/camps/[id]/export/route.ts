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
            kids: {
              include: {
                attendances: {
                  include: {
                    session: true,
                  },
                },
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

    // Get schedule slots
    const scheduleSlots = await prisma.scheduleSlot.findMany({
      where: { group: { campId } },
      include: {
        group: true,
        session: true,
        area: true,
      },
    });

    if (format === 'csv') {
      // Generate CSV
      const rows: string[] = [];
      rows.push('Name,Age,Group,Allergies,Checked In,Checked Out,Session 1,Session 2,Session 3,Session 4');

      for (const group of camp.groups) {
        for (const kid of group.kids) {
          const attendances = camp.sessions.map((session: { id: string }) => {
            const att = kid.attendances.find((a: { sessionId: string }) => a.sessionId === session.id);
            return att ? 'Yes' : 'No';
          });

          rows.push([
            `"${kid.name}"`,
            kid.age,
            group.name,
            `"${kid.allergies || ''}"`,
            kid.checkedIn ? 'Yes' : 'No',
            kid.checkedOut ? 'Yes' : 'No',
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

    // JSON format
    const exportData = {
      camp: {
        name: camp.name,
        description: camp.description,
        startDate: camp.startDate,
        endDate: camp.endDate,
        lunchTime: camp.lunchTime,
      },
      sessions: camp.sessions.map((s: { name: string; time: string; order: number }) => ({
        name: s.name,
        time: s.time,
        order: s.order,
      })),
      areas: camp.areas.map((a: { name: string; type: string }) => ({
        name: a.name,
        type: a.type,
      })),
      groups: camp.groups.map((g: { name: string; ageRange: string; kids: { name: string; age: number; allergies: string | null; checkedIn: boolean; checkedOut: boolean; attendances: { session: { name: string }; attended: boolean }[] }[] }) => ({
        name: g.name,
        ageRange: g.ageRange,
        kids: g.kids.map((k: { name: string; age: number; allergies: string | null; checkedIn: boolean; checkedOut: boolean; attendances: { session: { name: string }; attended: boolean }[] }) => ({
          name: k.name,
          age: k.age,
          allergies: k.allergies,
          checkedIn: k.checkedIn,
          checkedOut: k.checkedOut,
          attendance: k.attendances.map((a: { session: { name: string }; attended: boolean }) => ({
            session: a.session.name,
            attended: a.attended,
          })),
        })),
      })),
      schedule: scheduleSlots.map((s: { group: { name: string }; session: { name: string }; area: { name: string } }) => ({
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
