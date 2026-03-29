import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campId } = await params;
    const { kidId, sessionOrder, attended } = await request.json();

    const session = await prisma.session.findFirst({
      where: { campId, order: sessionOrder },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Use findFirst + create/update/delete instead of upsert for libsql compatibility
    const existing = await prisma.attendance.findFirst({
      where: { childId: kidId, sessionId: session.id },
    });

    if (attended) {
      if (existing) {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: { attended: true },
        });
      } else {
        await prisma.attendance.create({
          data: {
            childId: kidId,
            sessionId: session.id,
            attended: true,
          },
        });
      }
    } else {
      if (existing) {
        await prisma.attendance.delete({
          where: { id: existing.id },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Attendance error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campId } = await params;
    const { groupName, sessionOrder, markPresent } = await request.json();

    const session = await prisma.session.findFirst({
      where: { campId, order: sessionOrder },
    });

    const group = await prisma.group.findFirst({
      where: { campId, name: groupName },
      include: { children: true },
    });

    if (!session || !group) {
      return NextResponse.json({ error: 'Session or group not found' }, { status: 404 });
    }

    if (markPresent) {
      for (const child of group.children) {
        const existing = await prisma.attendance.findFirst({
          where: { childId: child.id, sessionId: session.id },
        });
        if (existing) {
          await prisma.attendance.update({
            where: { id: existing.id },
            data: { attended: true },
          });
        } else {
          await prisma.attendance.create({
            data: {
              childId: child.id,
              sessionId: session.id,
              attended: true,
            },
          });
        }
      }
    } else {
      await prisma.attendance.deleteMany({
        where: {
          childId: { in: group.children.map((c) => c.id) },
          sessionId: session.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk attendance error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
