import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get('campId');
    const date = searchParams.get('date');

    const where: Record<string, unknown> = { hasAllergies: true };
    if (campId) {
      where.booking = { campId };
    }

    const children = await prisma.child.findMany({
      where,
      include: {
        booking: {
          include: {
            camp: { include: { location: true } },
          },
        },
        dayBookings: {
          include: { campDay: true },
        },
        group: true,
      },
    });

    let filtered = children;
    if (date) {
      const targetDate = new Date(date).toDateString();
      filtered = children.filter((c) =>
        c.dayBookings.some((db) => new Date(db.campDay.date).toDateString() === targetDate)
      );
    }

    const rows: string[] = [];
    rows.push([
      'Child Name',
      'Age',
      'Allergy Details',
      'Group',
      'Location',
      'Days Attending',
      'Parent Name',
      'Parent Phone',
    ].join(','));

    for (const child of filtered) {
      const daysBooked = child.dayBookings.map((db) => db.campDay.dayLabel).join('; ');
      rows.push([
        `"${child.firstName} ${child.lastName}"`,
        child.age,
        `"${child.allergyDetails || ''}"`,
        `"${child.group?.name || 'Unassigned'}"`,
        `"${child.booking?.camp.location?.name || child.booking?.camp.name || ''}"`,
        `"${daysBooked}"`,
        `"${child.booking?.parentFirstName || ''} ${child.booking?.parentLastName || ''}"`,
        `"${child.booking?.parentPhone || ''}"`,
      ].join(','));
    }

    const csv = rows.join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="Allergy_Report_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Allergy export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
