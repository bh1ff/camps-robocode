import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Update kid
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; kidId: string }> }
) {
  try {
    const { kidId } = await params;
    const data = await request.json();

    const kid = await prisma.kid.update({
      where: { id: kidId },
      data: {
        allergies: data.allergies,
        checkedIn: data.checkedIn,
        checkedOut: data.checkedOut,
      },
    });

    return NextResponse.json({ success: true, kid });
  } catch (error) {
    console.error('Update kid error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Move kid to different group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; kidId: string }> }
) {
  try {
    const { id: campId, kidId } = await params;
    const { newGroupName } = await request.json();

    // Find the new group
    const newGroup = await prisma.group.findFirst({
      where: { campId, name: newGroupName },
    });

    if (!newGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const kid = await prisma.kid.update({
      where: { id: kidId },
      data: { groupId: newGroup.id },
    });

    return NextResponse.json({ success: true, kid });
  } catch (error) {
    console.error('Move kid error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
