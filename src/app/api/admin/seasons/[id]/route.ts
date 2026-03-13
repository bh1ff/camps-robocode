import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();

    const season = await prisma.season.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.slug && { slug: data.slug }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });

    return NextResponse.json(season);
  } catch (error) {
    console.error('Update season error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const campCount = await prisma.camp.count({ where: { seasonId: id } });
    if (campCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete season with ${campCount} camp(s). Remove camps first.` },
        { status: 400 }
      );
    }

    await prisma.priceTier.deleteMany({ where: { seasonId: id } });
    await prisma.season.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete season error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
