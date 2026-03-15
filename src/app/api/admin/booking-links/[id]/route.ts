import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendBookingInviteEmail } from '@/lib/email';
import { sendBookingInviteSMS } from '@/lib/sms';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === 'resend') {
      const record = await prisma.bookingToken.findUnique({
        where: { id },
        include: { camp: { include: { location: true } } },
      });
      if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if (record.used) return NextResponse.json({ error: 'Token already used' }, { status: 400 });

      const campName = record.camp.name;
      const locationName = record.camp.location?.name || record.camp.name;
      const sm = record.sendMethod || 'email';

      if ((sm === 'email' || sm === 'both') && record.parentEmail) {
        sendBookingInviteEmail(record.parentEmail, record.token, campName, locationName, record.paymentMethod)
          .catch((err) => console.error('Resend invite email failed:', err));
      }
      if ((sm === 'sms' || sm === 'both') && record.parentPhone) {
        sendBookingInviteSMS(record.parentPhone, record.token, campName, locationName, record.paymentMethod)
          .catch((err) => console.error('Resend invite SMS failed:', err));
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Booking link action error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.bookingToken.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete booking link error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
