import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import prisma from '@/lib/db';
import { sendConfirmationEmail, addToSubscriberList } from '@/lib/email';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const globalSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  const locationWebhookSecrets = await prisma.location.findMany({
    where: { stripeWebhookSecret: { not: null } },
    select: { stripeWebhookSecret: true, stripeSecretKey: true },
  });

  let event;
  let matchedStripeKey: string | null = null;

  try {
    event = getStripe().webhooks.constructEvent(body, sig, globalSecret);
  } catch {
    for (const loc of locationWebhookSecrets) {
      if (!loc.stripeWebhookSecret) continue;
      try {
        const stripe = getStripe(loc.stripeSecretKey);
        event = stripe.webhooks.constructEvent(body, sig, loc.stripeWebhookSecret);
        matchedStripeKey = loc.stripeSecretKey;
        break;
      } catch {
        continue;
      }
    }
  }

  if (!event) {
    console.error('Webhook signature verification failed for all keys');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'confirmed',
          stripePaymentStatus: 'paid',
        },
      });
      console.log(`Booking ${bookingId} confirmed via Stripe webhook${matchedStripeKey ? ' (location-specific key)' : ''}`);

      const fullBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          children: { include: { dayBookings: { include: { campDay: true } } } },
          camp: { include: { location: true } },
        },
      });
      if (fullBooking) {
        sendConfirmationEmail(fullBooking).catch((err) =>
          console.error('Confirmation email failed:', err)
        );
        addToSubscriberList(fullBooking.parentEmail, 'paid-booking').catch((err) =>
          console.error('Auto-subscribe on paid booking failed:', err)
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
