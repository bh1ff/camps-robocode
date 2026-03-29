import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; kidId: string }> }
) {
  try {
    const { id: campId, kidId } = await params;
    const data = await request.json();

    // Handle checkedIn / checkedOut on ChildDayBooking
    if (data.checkedIn !== undefined || data.checkedOut !== undefined) {
      // Find the day booking for this child in this camp
      const dayBooking = await prisma.childDayBooking.findFirst({
        where: {
          childId: kidId,
          campDay: { campId },
        },
      });

      if (dayBooking) {
        const bookingUpdate: Record<string, unknown> = {};
        if (data.checkedIn !== undefined) bookingUpdate.checkedIn = data.checkedIn;
        if (data.checkedOut !== undefined) bookingUpdate.checkedOut = data.checkedOut;

        await prisma.childDayBooking.update({
          where: { id: dayBooking.id },
          data: bookingUpdate,
        });
      }

      return NextResponse.json({ success: true });
    }

    // Handle allergy updates on Child
    const updateData: Record<string, unknown> = {};
    if (data.allergies !== undefined) {
      updateData.hasAllergies = !!data.allergies;
      updateData.allergyDetails = data.allergies || null;
    }

    const child = await prisma.child.update({
      where: { id: kidId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      kid: {
        id: child.id,
        name: `${child.firstName} ${child.lastName}`,
        allergies: child.allergyDetails || '',
      },
    });
  } catch (error) {
    console.error('Update child error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; kidId: string }> }
) {
  try {
    const { id: campId, kidId } = await params;
    const { newGroupName } = await request.json();

    const newGroup = await prisma.group.findFirst({
      where: { campId, name: newGroupName },
    });

    if (!newGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const child = await prisma.child.update({
      where: { id: kidId },
      data: { groupId: newGroup.id },
    });

    return NextResponse.json({
      success: true,
      kid: {
        id: child.id,
        name: `${child.firstName} ${child.lastName}`,
      },
    });
  } catch (error) {
    console.error('Move child error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
