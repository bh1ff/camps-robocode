import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();

    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData.status = data.status;

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        children: { include: { dayBookings: { include: { campDay: true } } } },
        camp: { include: { location: true } },
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
