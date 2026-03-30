import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Get all camps
export async function GET() {
  try {
    const camps = await prisma.camp.findMany({
      include: {
        _count: {
          select: {
            groups: true,
          },
        },
        groups: {
          include: {
            _count: {
              select: { children: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const campsWithStats = camps.map((camp) => ({
      id: camp.id,
      name: camp.name,
      description: camp.description,
      startDate: camp.startDate,
      endDate: camp.endDate,
      groupCount: camp._count.groups,
      kidCount: camp.groups.reduce((sum, g) => sum + g._count.children, 0),
      createdAt: camp.createdAt,
    }));

    return NextResponse.json(campsWithStats);
  } catch (error) {
    console.error('Get camps error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Create a new camp
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
        lunchTime: data.lunchTime || '12:00-13:00',
      },
    });

    // Create default sessions (3 x 1hr, lunch 12-1)
    const sessions = [
      { name: 'Session 1', time: '10:00-11:00', order: 1 },
      { name: 'Session 2', time: '11:00-12:00', order: 2 },
      { name: 'Session 3', time: '13:00-14:00', order: 3 },
    ];

    await prisma.session.createMany({
      data: sessions.map((s: { name: string; time: string; order: number }) => ({ ...s, campId: camp.id })),
    });

    // Create default areas (3 activities)
    const areas = [
      { name: 'Mechanical', type: 'mechanical' },
      { name: 'Electronic', type: 'electronic' },
      { name: 'Physical', type: 'physical' },
    ];

    await prisma.area.createMany({
      data: areas.map((a: { name: string; type: string }) => ({ ...a, campId: camp.id })),
    });

    return NextResponse.json({ success: true, camp });
  } catch (error) {
    console.error('Create camp error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
