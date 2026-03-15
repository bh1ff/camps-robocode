import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const regions = await prisma.region.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
    return NextResponse.json(regions);
  } catch {
    return NextResponse.json([]);
  }
}
