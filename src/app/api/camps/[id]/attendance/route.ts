import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campId } = await params;
    const { kidId, sessionOrder, attended } = await request.json();

    // Find the session by order
    const session = await prisma.session.findFirst({
      where: { campId, order: sessionOrder },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (attended) {
      // Create or update attendance record
      await prisma.attendance.upsert({
        where: {
          kidId_sessionId: {
            kidId,
            sessionId: session.id,
          },
        },
        update: { attended: true },
        create: {
          kidId,
          sessionId: session.id,
          attended: true,
        },
      });
    } else {
      // Delete attendance record
      await prisma.attendance.deleteMany({
        where: {
          kidId,
          sessionId: session.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Attendance error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Bulk update attendance (mark all present/absent)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campId } = await params;
    const { groupName, sessionOrder, markPresent } = await request.json();

    // Find the session and group
    const session = await prisma.session.findFirst({
      where: { campId, order: sessionOrder },
    });

    const group = await prisma.group.findFirst({
      where: { campId, name: groupName },
      include: { kids: true },
    });

    if (!session || !group) {
      return NextResponse.json({ error: 'Session or group not found' }, { status: 404 });
    }

    if (markPresent) {
      // Create attendance for all kids in group using upsert
      for (const kid of group.kids) {
        await prisma.attendance.upsert({
          where: {
            kidId_sessionId: {
              kidId: kid.id,
              sessionId: session.id,
            },
          },
          update: { attended: true },
          create: {
            kidId: kid.id,
            sessionId: session.id,
            attended: true,
          },
        });
      }
    } else {
      // Remove all attendance for this group/session
      await prisma.attendance.deleteMany({
        where: {
          kidId: { in: group.kids.map((k: { id: string }) => k.id) },
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
