import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendConfirmationEmail, addToSubscriberList } from '@/lib/email';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const record = await prisma.bookingToken.findUnique({
      where: { token },
      include: {
        camp: {
          include: {
            location: true,
            campDays: { orderBy: { date: 'asc' } },
          },
        },
      },
    });

    if (!record) return NextResponse.json({ error: 'Invalid link' }, { status: 404 });
    if (record.used) return NextResponse.json({ error: 'This link has already been used' }, { status: 410 });
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This link has expired' }, { status: 410 });
    }

    return NextResponse.json({
      paymentMethod: record.paymentMethod,
      parentEmail: record.parentEmail,
      camp: {
        id: record.camp.id,
        name: record.camp.name,
        location: record.camp.location ? { name: record.camp.location.name, address: record.camp.location.address } : null,
        campDays: record.camp.campDays.map((d) => ({
          id: d.id,
          dayLabel: d.dayLabel,
          date: d.date,
          weekNumber: d.weekNumber,
        })),
      },
    });
  } catch (error) {
    console.error('Validate invite token error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const record = await prisma.bookingToken.findUnique({
      where: { token },
      include: { camp: { include: { location: true, campDays: true } } },
    });

    if (!record) return NextResponse.json({ error: 'Invalid link' }, { status: 404 });
    if (record.used) return NextResponse.json({ error: 'This link has already been used' }, { status: 410 });
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This link has expired' }, { status: 410 });
    }

    const data = await request.json();

    const isHaf = record.paymentMethod === 'haf';

    const booking = await prisma.booking.create({
      data: {
        type: isHaf ? 'haf' : 'paid',
        status: 'confirmed',
        paymentMethod: record.paymentMethod,
        parentFirstName: data.parentFirstName,
        parentLastName: data.parentLastName,
        parentEmail: data.parentEmail || record.parentEmail,
        parentPhone: data.parentPhone,
        address: data.address || '',
        postcode: data.postcode || '',
        totalAmount: 0,
        campId: record.campId,
        children: {
          create: (data.children || []).map((child: Record<string, unknown>) => ({
            firstName: child.firstName as string,
            lastName: child.lastName as string,
            dateOfBirth: child.dateOfBirth ? new Date(child.dateOfBirth as string) : null,
            age: Number(child.age) || 0,
            schoolName: (child.schoolName as string) || null,
            hafCode: (child.hafCode as string) || null,
            fsmEligible: true,
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

    await prisma.bookingToken.update({
      where: { id: record.id },
      data: { used: true },
    });

    sendConfirmationEmail(booking).catch((err) =>
      console.error('Invite booking confirmation email failed:', err)
    );
    addToSubscriberList(data.parentEmail || record.parentEmail, isHaf ? 'haf-booking' : 'paid-booking').catch(() => {});

    return NextResponse.json({ success: true, booking: { id: booking.id } });
  } catch (error) {
    console.error('Submit invite booking error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
