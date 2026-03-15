import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import prisma from '@/lib/db';
import { sendBookingInviteEmail } from '@/lib/email';
import { sendBookingInviteSMS } from '@/lib/sms';

export async function GET() {
  try {
    const tokens = await prisma.bookingToken.findMany({
      orderBy: { createdAt: 'desc' },
      include: { camp: { include: { location: true } } },
    });
    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Get booking links error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campId, paymentMethod, parentEmail, parentPhone, sendMethod = 'email' } = body;

    if (!campId || !paymentMethod) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    if ((sendMethod === 'email' || sendMethod === 'both') && !parentEmail) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    if ((sendMethod === 'sms' || sendMethod === 'both') && !parentPhone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const camp = await prisma.camp.findUnique({
      where: { id: campId },
      include: { location: true },
    });
    if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 });

    const token = randomBytes(32).toString('hex');
    const campName = camp.name;
    const locationName = camp.location?.name || camp.name;

    const record = await prisma.bookingToken.create({
      data: {
        token,
        campId,
        paymentMethod,
        parentEmail: parentEmail || '',
        parentPhone: parentPhone || null,
        sendMethod,
      },
    });

    if (sendMethod === 'email' || sendMethod === 'both') {
      sendBookingInviteEmail(parentEmail, token, campName, locationName, paymentMethod)
        .catch((err) => console.error('Booking invite email failed:', err));
    }
    if (sendMethod === 'sms' || sendMethod === 'both') {
      sendBookingInviteSMS(parentPhone, token, campName, locationName, paymentMethod)
        .catch((err) => console.error('Booking invite SMS failed:', err));
    }

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Create booking link error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
