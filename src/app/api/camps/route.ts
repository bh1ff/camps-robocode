import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const camps = await prisma.camp.findMany({
      include: {
        location: true,
        _count: {
          select: { groups: true },
        },
        groups: {
          include: {
            _count: {
              select: { children: true },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    const campsWithStats = camps.map((camp) => ({
      id: camp.id,
      name: camp.name,
      description: camp.description,
      startDate: camp.startDate,
      endDate: camp.endDate,
      location: camp.location?.name || null,
      groupCount: camp._count.groups,
      kidCount: camp.groups.reduce((sum, g) => sum + g._count.children, 0),
    }));

    return NextResponse.json(campsWithStats);
  } catch (error) {
    console.error('Get camps error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
