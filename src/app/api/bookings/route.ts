import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hafBookingSchema, paidBookingSchema } from '@/lib/validation';
import { sendConfirmationEmail, addToSubscriberList } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const isHaf = body.type === 'haf';

    const schema = isHaf ? hafBookingSchema : paidBookingSchema;
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const camp = await prisma.camp.findUnique({
      where: { id: data.campId },
      include: {
        location: true,
        campDays: {
          include: {
            childDays: {
              include: {
                child: { include: { booking: true } },
              },
            },
          },
        },
      },
    });

    if (!camp) {
      return NextResponse.json({ error: 'Camp not found' }, { status: 404 });
    }

    const selectedDayIds = data.selectedDays;
    const childCount = data.children.length;

    for (const dayId of selectedDayIds) {
      const day = camp.campDays.find((d) => d.id === dayId);
      if (!day) {
        return NextResponse.json({ error: `Invalid day: ${dayId}` }, { status: 400 });
      }

      const currentBookedCount = day.childDays.filter(
        (cd) => cd.child.booking?.status !== 'cancelled'
      ).length;

      const capacity = camp.location?.capacityPerDay ?? 999;
      if (currentBookedCount + childCount > capacity) {
        return NextResponse.json(
          { error: `${day.dayLabel} is fully booked. Only ${capacity - currentBookedCount} spots remaining.` },
          { status: 409 }
        );
      }
    }

    const booking = await prisma.booking.create({
      data: {
        type: isHaf ? 'haf' : 'paid',
        status: isHaf ? 'confirmed' : 'pending',
        parentFirstName: data.parentFirstName,
        parentLastName: data.parentLastName,
        parentEmail: data.parentEmail,
        parentPhone: data.parentPhone,
        address: data.address,
        postcode: data.postcode,
        totalAmount: body.totalAmount || 0,
        campId: data.campId,
        children: {
          create: data.children.map((child) => ({
            firstName: child.firstName,
            lastName: child.lastName,
            dateOfBirth: child.dateOfBirth ? new Date(child.dateOfBirth) : null,
            age: child.age,
            schoolName: child.schoolName,
            schoolYear: child.schoolYear,
            hafCode: child.hafCode || null,
            fsmEligible: child.fsmEligible ?? true,
            ethnicity: child.ethnicity || null,
            gender: child.gender || null,
            hasSEND: child.hasSEND,
            hasEHCP: child.hasEHCP,
            ehcpDetails: child.ehcpDetails || null,
            hasAllergies: child.hasAllergies,
            allergyDetails: child.allergyDetails || null,
            photoPermission: child.photoPermission,
            dayBookings: {
              create: selectedDayIds.map((dayId) => ({
                campDayId: dayId,
              })),
            },
          })),
        },
      },
      include: {
        children: {
          include: { dayBookings: true },
        },
      },
    });

    if (isHaf) {
      const fullBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          children: { include: { dayBookings: { include: { campDay: true } } } },
          camp: { include: { location: true } },
        },
      });
      if (fullBooking) {
        sendConfirmationEmail(fullBooking).catch((err) =>
          console.error('HAF confirmation email failed:', err)
        );
      }
    }

    addToSubscriberList(data.parentEmail, isHaf ? 'haf-booking' : 'paid-booking').catch((err) =>
      console.error('Auto-subscribe failed:', err)
    );

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get('campId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (campId) where.campId = campId;
    if (type) where.type = type;
    if (status) where.status = status;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        children: {
          include: {
            dayBookings: {
              include: { campDay: true },
            },
          },
        },
        camp: {
          include: { location: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
