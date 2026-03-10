import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get('campId');

    const where: Record<string, unknown> = { hasEHCP: true };
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
      },
    });

    const rows: string[] = [];
    rows.push([
      'Child First Name',
      'Child Last Name',
      'Age',
      'EHCP Details',
      'SEND',
      'Parent Name',
      'Parent Email',
      'Parent Phone',
      'Location',
      'Days Booked',
      'Allergies',
    ].join(','));

    for (const child of children) {
      const daysBooked = child.dayBookings.map((db) => db.campDay.dayLabel).join('; ');
      rows.push([
        `"${child.firstName}"`,
        `"${child.lastName}"`,
        child.age,
        `"${child.ehcpDetails || 'Not specified'}"`,
        child.hasSEND ? 'Yes' : 'No',
        `"${child.booking?.parentFirstName || ''} ${child.booking?.parentLastName || ''}"`,
        `"${child.booking?.parentEmail || ''}"`,
        `"${child.booking?.parentPhone || ''}"`,
        `"${child.booking?.camp.location?.name || child.booking?.camp.name || ''}"`,
        `"${daysBooked}"`,
        `"${child.allergyDetails || 'None'}"`,
      ].join(','));
    }

    const csv = rows.join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="EHCP_Report_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('EHCP export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
