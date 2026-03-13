import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const [
      totalBookings,
      confirmedBookings,
      pendingBookings,
      totalChildren,
      totalRevenue,
      locations,
      activeSeason,
      recentBookings,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'confirmed' } }),
      prisma.booking.count({ where: { status: 'pending' } }),
      prisma.child.count(),
      prisma.booking.aggregate({ _sum: { totalAmount: true }, where: { status: 'confirmed', type: 'paid' } }),
      prisma.location.count(),
      prisma.season.findFirst({ where: { active: true }, include: { camps: { include: { _count: { select: { bookings: true } } } } } }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { children: true, camp: { include: { location: true } } },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        totalChildren,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        locations,
      },
      activeSeason,
      recentBookings,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
