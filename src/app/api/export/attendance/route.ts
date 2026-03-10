import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get('campId');

    if (!campId) {
      return NextResponse.json({ error: 'campId required' }, { status: 400 });
    }

    const camp = await prisma.camp.findUnique({
      where: { id: campId },
      include: {
        location: true,
        campDays: {
          orderBy: { date: 'asc' },
          include: {
            childDays: {
              include: {
                child: {
                  include: {
                    booking: true,
                    group: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!camp) {
      return NextResponse.json({ error: 'Camp not found' }, { status: 404 });
    }

    const rows: string[] = [];
    const dayHeaders = camp.campDays.map((d) => d.dayLabel);
    rows.push([
      'Child Name',
      'Age',
      'Group',
      'Booking Type',
      ...dayHeaders.flatMap((d) => [`${d} - Booked`, `${d} - Checked In`]),
    ].join(','));

    const allChildIds = new Set<string>();
    const childData: Record<string, {
      name: string;
      age: number;
      group: string;
      type: string;
      days: Record<string, { booked: boolean; checkedIn: boolean }>;
    }> = {};

    for (const day of camp.campDays) {
      for (const cd of day.childDays) {
        const childId = cd.childId;
        allChildIds.add(childId);

        if (!childData[childId]) {
          childData[childId] = {
            name: `${cd.child.firstName} ${cd.child.lastName}`,
            age: cd.child.age,
            group: cd.child.group?.name || 'Unassigned',
            type: cd.child.booking?.type || 'unknown',
            days: {},
          };
        }

        childData[childId].days[day.id] = {
          booked: true,
          checkedIn: cd.checkedIn,
        };
      }
    }

    for (const childId of allChildIds) {
      const c = childData[childId];
      const dayCols = camp.campDays.flatMap((d) => {
        const dayInfo = c.days[d.id];
        return [
          dayInfo?.booked ? 'Yes' : 'No',
          dayInfo?.checkedIn ? 'Yes' : 'No',
        ];
      });

      rows.push([
        `"${c.name}"`,
        c.age,
        `"${c.group}"`,
        c.type.toUpperCase(),
        ...dayCols,
      ].join(','));
    }

    const csv = rows.join('\n');
    const filename = `Attendance_${camp.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Attendance export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
