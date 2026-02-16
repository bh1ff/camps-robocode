import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campId } = await params;
    const { password, role } = await request.json();

    const camp = await prisma.camp.findUnique({
      where: { id: campId },
      select: {
        id: true,
        name: true,
        adminPassword: true,
        teacherPassword: true,
      },
    });

    if (!camp) {
      return NextResponse.json({ error: 'Camp not found' }, { status: 404 });
    }

    const expectedPassword = role === 'admin' ? camp.adminPassword : camp.teacherPassword;

    if (password !== expectedPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      campId: camp.id,
      campName: camp.name,
      role,
    });
  } catch (error) {
    console.error('Camp auth error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
