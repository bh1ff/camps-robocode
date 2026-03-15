import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.subscriber.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete subscriber error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
