import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const season = await prisma.season.findFirst({
      where: { active: true },
      select: { id: true, title: true, startDate: true, endDate: true },
    });

    if (!season) {
      return NextResponse.json({ title: 'Holiday Tech Camp', startDate: null, endDate: null });
    }

    return NextResponse.json(season);
  } catch (error) {
    console.error('Get active season error:', error);
    return NextResponse.json({ title: 'Holiday Tech Camp', startDate: null, endDate: null });
  }
}
