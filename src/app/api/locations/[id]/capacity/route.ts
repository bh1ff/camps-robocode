import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: locationId } = await params;

    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: {
        camps: {
          include: {
            campDays: {
              include: {
                childDays: {
                  include: {
                    child: {
                      include: { booking: true },
                    },
                  },
                },
              },
              orderBy: { date: 'asc' },
            },
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const capacityByDay = location.camps.flatMap((camp) =>
      camp.campDays.map((day) => {
        const confirmedBookings = day.childDays.filter(
          (cd) => cd.child.booking?.status === 'confirmed' || cd.child.booking?.status === 'pending'
        );
        const hafCount = confirmedBookings.filter(
          (cd) => cd.child.booking?.type === 'haf'
        ).length;
        const paidCount = confirmedBookings.filter(
          (cd) => cd.child.booking?.type === 'paid'
        ).length;

        return {
          campDayId: day.id,
          date: day.date,
          dayLabel: day.dayLabel,
          weekNumber: day.weekNumber,
          campId: camp.id,
          campName: camp.name,
          totalCapacity: location.capacityPerDay,
          booked: confirmedBookings.length,
          hafCount,
          paidCount,
          remaining: location.capacityPerDay - confirmedBookings.length,
        };
      })
    );

    return NextResponse.json({
      location: {
        id: location.id,
        name: location.name,
        region: location.region,
        capacityPerDay: location.capacityPerDay,
        hafSeatsTotal: location.hafSeatsTotal,
        allowsPaid: location.allowsPaid,
      },
      days: capacityByDay,
    });
  } catch (error) {
    console.error('Capacity error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
