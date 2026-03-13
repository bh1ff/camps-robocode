import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const campId = searchParams.get('campId');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (campId) where.campId = campId;
    if (search) {
      where.OR = [
        { parentFirstName: { contains: search } },
        { parentLastName: { contains: search } },
        { parentEmail: { contains: search } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        children: {
          include: { dayBookings: { include: { campDay: true } } },
        },
        camp: { include: { location: true, season: true } },
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
