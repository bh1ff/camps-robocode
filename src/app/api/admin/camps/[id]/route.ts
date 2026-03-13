import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.adminPassword !== undefined) updateData.adminPassword = data.adminPassword;
    if (data.teacherPassword !== undefined) updateData.teacherPassword = data.teacherPassword;
    if (data.lunchTime !== undefined) updateData.lunchTime = data.lunchTime;
    if (data.locationId !== undefined) updateData.locationId = data.locationId;
    if (data.seasonId !== undefined) updateData.seasonId = data.seasonId;

    const camp = await prisma.camp.update({ where: { id }, data: updateData });

    if (data.days && Array.isArray(data.days)) {
      await prisma.campDay.deleteMany({ where: { campId: id } });
      for (const day of data.days) {
        await prisma.campDay.create({
          data: {
            date: new Date(day.date),
            dayLabel: day.dayLabel || new Date(day.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
            weekNumber: day.weekNumber || 1,
            campId: id,
          },
        });
      }
    }

    const updated = await prisma.camp.findUnique({
      where: { id },
      include: { campDays: { orderBy: { date: 'asc' } }, location: true, season: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update camp error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const bookingCount = await prisma.booking.count({ where: { campId: id } });
    if (bookingCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete camp with ${bookingCount} booking(s). Cancel bookings first.` },
        { status: 400 }
      );
    }

    await prisma.campDay.deleteMany({ where: { campId: id } });
    await prisma.session.deleteMany({ where: { campId: id } });
    await prisma.area.deleteMany({ where: { campId: id } });
    await prisma.group.deleteMany({ where: { campId: id } });
    await prisma.camp.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete camp error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
