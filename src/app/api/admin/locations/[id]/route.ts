import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.region !== undefined) updateData.region = data.region;
    if (data.capacityPerDay !== undefined) updateData.capacityPerDay = parseInt(data.capacityPerDay);
    if (data.hafSeatsTotal !== undefined) updateData.hafSeatsTotal = parseInt(data.hafSeatsTotal);
    if (data.allowsPaid !== undefined) updateData.allowsPaid = data.allowsPaid;
    if (data.stripeSecretKey !== undefined) updateData.stripeSecretKey = data.stripeSecretKey || null;
    if (data.stripePublishableKey !== undefined) updateData.stripePublishableKey = data.stripePublishableKey || null;
    if (data.stripeWebhookSecret !== undefined) updateData.stripeWebhookSecret = data.stripeWebhookSecret || null;

    const location = await prisma.location.update({ where: { id }, data: updateData });

    return NextResponse.json(location);
  } catch (error) {
    console.error('Update location error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const campCount = await prisma.camp.count({ where: { locationId: id } });
    if (campCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete location with ${campCount} camp(s). Remove camps first.` },
        { status: 400 }
      );
    }

    await prisma.location.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete location error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
