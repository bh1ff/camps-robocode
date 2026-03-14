import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const activeSeason = await prisma.season.findFirst({
      where: { active: true },
      select: { id: true },
    });

    const locations = await prisma.location.findMany({
      include: {
        camps: {
          where: {
            active: true,
            ...(activeSeason ? { seasonId: activeSeason.id } : {}),
          },
          include: {
            campDays: { orderBy: { date: 'asc' } },
            _count: { select: { bookings: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const filtered = locations.filter((loc) => loc.camps.length > 0);
    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Get locations error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const location = await prisma.location.create({
      data: {
        name: data.name,
        address: data.address || '',
        region: data.region,
        capacityPerDay: data.capacityPerDay,
        hafSeatsTotal: data.hafSeatsTotal,
        allowsPaid: data.allowsPaid || false,
      },
    });

    return NextResponse.json({ success: true, location });
  } catch (error) {
    console.error('Create location error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
