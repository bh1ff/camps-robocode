import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const camp = await prisma.camp.findUnique({
      where: { id },
      include: {
        location: true,
        groups: {
          include: {
            children: {
              include: {
                attendances: true,
              },
            },
          },
        },
        areas: true,
        sessions: {
          orderBy: { order: 'asc' },
        },
        campDays: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!camp) {
      return NextResponse.json({ error: 'Camp not found' }, { status: 404 });
    }

    const scheduleSlots = await prisma.scheduleSlot.findMany({
      where: { group: { campId: id } },
      include: {
        group: true,
        session: true,
        area: true,
      },
    });

    return NextResponse.json({ camp, scheduleSlots });
  } catch (error) {
    console.error('Get camp error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const camp = await prisma.camp.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        adminPassword: data.adminPassword,
        teacherPassword: data.teacherPassword,
        lunchTime: data.lunchTime,
      },
    });

    return NextResponse.json({ success: true, camp });
  } catch (error) {
    console.error('Update camp error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.camp.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete camp error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
