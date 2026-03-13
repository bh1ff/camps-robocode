import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');

    const where = seasonId ? { seasonId } : {};
    const tiers = await prisma.priceTier.findMany({
      where,
      orderBy: { order: 'asc' },
      include: { season: true },
    });

    return NextResponse.json(tiers);
  } catch (error) {
    console.error('Get pricing error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { seasonId, tiers } = data;

    if (!tiers || !Array.isArray(tiers)) {
      return NextResponse.json({ error: 'tiers array required' }, { status: 400 });
    }

    if (seasonId) {
      await prisma.priceTier.deleteMany({ where: { seasonId } });
    }

    const created = await prisma.priceTier.createMany({
      data: tiers.map((t: { days: number; pricePence: number }, idx: number) => ({
        days: t.days,
        pricePence: t.pricePence,
        order: idx + 1,
        seasonId: seasonId || null,
      })),
    });

    return NextResponse.json({ success: true, count: created.count });
  } catch (error) {
    console.error('Update pricing error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
