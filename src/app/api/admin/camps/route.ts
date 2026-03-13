import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const camps = await prisma.camp.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        location: true,
        season: true,
        campDays: { orderBy: { date: 'asc' } },
        _count: { select: { bookings: true, groups: true } },
      },
    });
    return NextResponse.json(camps);
  } catch (error) {
    console.error('Get camps error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const camp = await prisma.camp.create({
      data: {
        name: data.name,
        description: data.description || null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        adminPassword: data.adminPassword || 'admin2026',
        teacherPassword: data.teacherPassword || 'teacher2026',
        lunchTime: data.lunchTime || '12:00-12:30',
        locationId: data.locationId || null,
        seasonId: data.seasonId || null,
      },
    });

    if (data.days && Array.isArray(data.days)) {
      for (const day of data.days) {
        await prisma.campDay.create({
          data: {
            date: new Date(day.date),
            dayLabel: day.dayLabel || new Date(day.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
            weekNumber: day.weekNumber || 1,
            campId: camp.id,
          },
        });
      }
    }

    const created = await prisma.camp.findUnique({
      where: { id: camp.id },
      include: { campDays: { orderBy: { date: 'asc' } }, location: true, season: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Create camp error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
