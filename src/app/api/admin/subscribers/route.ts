import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const subscribers = await prisma.subscriber.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(subscribers);
  } catch (error) {
    console.error('Get subscribers error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
