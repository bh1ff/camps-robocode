import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import prisma from '@/lib/db';
import { getActivePriceTiers, calculateBookingTotalWithTiers } from '@/lib/pricing';

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        children: {
          include: {
            dayBookings: {
              include: { campDay: true },
            },
          },
        },
        camp: { include: { location: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.type !== 'paid') {
      return NextResponse.json({ error: 'Payment not required for HAF bookings' }, { status: 400 });
    }

    const tiers = await getActivePriceTiers();
    const daysPerChild = booking.children.map((c) => c.dayBookings.length);
    const { totalPence, perChild } = calculateBookingTotalWithTiers(daysPerChild, tiers);

    const locationStripeKey = booking.camp.location?.stripeSecretKey;
    const stripe = getStripe(locationStripeKey);

    const lineItems = booking.children.map((child, idx) => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: `${child.firstName} ${child.lastName} - Holiday Tech Camp`,
          description: `${perChild[idx].days} day${perChild[idx].days !== 1 ? 's' : ''} at ${booking.camp.location?.name || booking.camp.name}`,
        },
        unit_amount: perChild[idx].pence,
      },
      quantity: 1,
    }));

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/book/confirm?bookingId=${booking.id}&status=success`,
      cancel_url: `${baseUrl}/book/confirm?bookingId=${booking.id}&status=cancelled`,
      customer_email: booking.parentEmail,
      metadata: {
        bookingId: booking.id,
      },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        stripeSessionId: session.id,
        totalAmount: totalPence / 100,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Create payment session error:', error);
    return NextResponse.json({ error: 'Payment error' }, { status: 500 });
  }
}
