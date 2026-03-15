import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        camps: { include: { location: true, campDays: { orderBy: { date: 'asc' }, select: { id: true, date: true, dayLabel: true, weekNumber: true } }, _count: { select: { bookings: true } } } },
        priceTiers: { orderBy: { order: 'asc' } },
      },
    });
    return NextResponse.json(seasons);
  } catch (error) {
    console.error('Get seasons error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const slug = data.slug || data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const isActive = data.active ?? true;
    if (isActive) {
      await prisma.season.updateMany({
        where: {},
        data: { active: false },
      });
    }

    const season = await prisma.season.create({
      data: {
        title: data.title,
        slug,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        active: isActive,
      },
    });

    return NextResponse.json(season, { status: 201 });
  } catch (error) {
    console.error('Create season error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
