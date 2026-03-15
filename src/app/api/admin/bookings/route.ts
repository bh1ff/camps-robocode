import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendConfirmationEmail, addToSubscriberList } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const camp = await prisma.camp.findUnique({
      where: { id: data.campId },
      include: { location: true, campDays: true },
    });
    if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 });

    const isHaf = data.paymentMethod === 'haf';

    const booking = await prisma.booking.create({
      data: {
        type: isHaf ? 'haf' : 'paid',
        status: 'confirmed',
        paymentMethod: data.paymentMethod,
        parentFirstName: data.parentFirstName,
        parentLastName: data.parentLastName,
        parentEmail: data.parentEmail,
        parentPhone: data.parentPhone,
        address: data.address || '',
        postcode: data.postcode || '',
        totalAmount: data.totalAmount || 0,
        campId: data.campId,
        children: {
          create: (data.children || []).map((child: Record<string, unknown>) => ({
            firstName: child.firstName as string,
            lastName: child.lastName as string,
            dateOfBirth: child.dateOfBirth ? new Date(child.dateOfBirth as string) : null,
            age: Number(child.age) || 0,
            schoolName: (child.schoolName as string) || null,
            schoolYear: (child.schoolYear as string) || null,
            hafCode: (child.hafCode as string) || null,
            fsmEligible: (child.fsmEligible as boolean) ?? true,
            hasSEND: (child.hasSEND as boolean) ?? false,
            hasEHCP: (child.hasEHCP as boolean) ?? false,
            ehcpDetails: (child.ehcpDetails as string) || null,
            hasAllergies: (child.hasAllergies as boolean) ?? false,
            allergyDetails: (child.allergyDetails as string) || null,
            photoPermission: (child.photoPermission as boolean) ?? false,
            dayBookings: {
              create: ((data.selectedDays || []) as string[]).map((dayId: string) => ({
                campDayId: dayId,
              })),
            },
          })),
        },
      },
      include: {
        children: { include: { dayBookings: { include: { campDay: true } } } },
        camp: { include: { location: true } },
      },
    });

    sendConfirmationEmail(booking).catch((err) =>
      console.error('Admin booking confirmation email failed:', err)
    );
    addToSubscriberList(data.parentEmail, isHaf ? 'haf-booking' : 'paid-booking').catch(() => {});

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error) {
    console.error('Admin create booking error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const campId = searchParams.get('campId');
    const season = searchParams.get('season');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (campId) where.campId = campId;
    if (season) where.camp = { season: { title: season } };
    if (search) {
      where.OR = [
        { parentFirstName: { contains: search } },
        { parentLastName: { contains: search } },
        { parentEmail: { contains: search } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        children: {
          include: { dayBookings: { include: { campDay: true } } },
        },
        camp: { include: { location: true, season: true } },
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
