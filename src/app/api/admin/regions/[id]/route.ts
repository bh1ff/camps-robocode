import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;

    const oldRegion = await prisma.region.findUnique({ where: { id } });

    const region = await prisma.region.update({ where: { id }, data: updateData });

    if (data.slug && oldRegion && oldRegion.slug !== data.slug) {
      await prisma.location.updateMany({
        where: { region: oldRegion.slug },
        data: { region: data.slug },
      });
    }

    return NextResponse.json(region);
  } catch (error) {
    console.error('Update region error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const region = await prisma.region.findUnique({ where: { id } });
    if (!region) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const locCount = await prisma.location.count({ where: { region: region.slug } });
    if (locCount > 0) {
      return NextResponse.json({ error: `Cannot delete region with ${locCount} location(s). Move or delete them first.` }, { status: 409 });
    }

    await prisma.region.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete region error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
