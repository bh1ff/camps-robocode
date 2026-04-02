import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campId: string }> }
) {
  try {
    const { campId } = await params;

    const camp = await prisma.camp.findUnique({
      where: { id: campId },
      include: {
        location: { select: { name: true } },
        groups: {
          orderBy: { name: 'asc' },
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
    });

    if (!camp) {
      return NextResponse.json({ error: 'Camp not found' }, { status: 404 });
    }

    // Build CSV
    const sessionHeaders = camp.sessions.map((s) => s.name).join(',');
    const rows: string[] = [];
    rows.push(`Camp:,${camp.name}`);
    rows.push(`Location:,${camp.location?.name || 'N/A'}`);
    rows.push(`Date:,${new Date(camp.startDate).toLocaleDateString('en-GB')}`);
    rows.push('');
    rows.push(`Name,Age,Group,Band Colour,Allergies,Checked In,Checked Out,${sessionHeaders}`);

    for (const group of camp.groups) {
      for (const child of group.children) {
        const dayBooking = child.dayBookings[0];
        const sessionCols = camp.sessions.map((session) => {
          const att = child.attendances.find((a) => a.sessionId === session.id);
          return att?.attended ? 'Yes' : 'No';
        });

        rows.push([
          `"${child.firstName} ${child.lastName}"`,
          child.age,
          group.name,
          group.color,
          `"${child.allergyDetails || ''}"`,
          dayBooking?.checkedIn ? 'Yes' : 'No',
          dayBooking?.checkedOut ? 'Yes' : 'No',
          ...sessionCols,
        ].join(','));
      }
    }

    // Summary section
    const allKids = camp.groups.flatMap((g) => g.children);
    rows.push('');
    rows.push('--- SUMMARY ---');
    rows.push(`Total Registered,${allKids.length}`);
    rows.push(`Total Checked In,${allKids.filter((k) => k.dayBookings.some((db) => db.checkedIn)).length}`);
    rows.push(`Total Checked Out,${allKids.filter((k) => k.dayBookings.some((db) => db.checkedOut)).length}`);
    rows.push('');
    rows.push('Session,Attended,Total,Attendance %');
    for (const session of camp.sessions) {
      const attended = allKids.filter((k) =>
        k.attendances.some((a) => a.sessionId === session.id && a.attended)
      ).length;
      const pct = allKids.length > 0 ? Math.round((attended / allKids.length) * 100) : 0;
      rows.push(`${session.name} (${session.time}),${attended},${allKids.length},${pct}%`);
    }

    rows.push('');
    rows.push('Group,Band,Age Range,Registered,Checked In');
    for (const group of camp.groups) {
      const groupCheckedIn = group.children.filter((k) => k.dayBookings.some((db) => db.checkedIn)).length;
      rows.push(`Group ${group.name},${group.color},${group.ageRange},${group.children.length},${groupCheckedIn}`);
    }

    const filename = camp.name.replace(/[^a-z0-9]/gi, '_') + '_attendance.csv';
    return new NextResponse(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Extract camp CSV error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
