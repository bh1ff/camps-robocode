import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { email, region, phone } = await request.json();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const normalised = email.trim().toLowerCase();
    const phoneValue = typeof phone === 'string' && phone.trim() ? phone.trim() : null;

    const existing = await prisma.subscriber.findUnique({ where: { email: normalised } });

    await prisma.subscriber.upsert({
      where: { email: normalised },
      update: { ...(region && { region }), ...(phoneValue !== null && { phone: phoneValue }) },
      create: { email: normalised, source: 'website', region: region || null, phone: phoneValue },
    });

    if (!existing) {
      sendWelcomeEmail(normalised).catch((err) =>
        console.error('Welcome email failed (subscriber saved):', err)
      );
    }

    if (process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_LIST_ID) {
      const dc = process.env.MAILCHIMP_API_KEY.split('-').pop();
      try {
        await fetch(
          `https://${dc}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_LIST_ID}/members`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `apikey ${process.env.MAILCHIMP_API_KEY}`,
            },
            body: JSON.stringify({
              email_address: normalised,
              status: 'subscribed',
              tags: ['camps-interest'],
            }),
          }
        );
      } catch (mcErr) {
        console.error('Mailchimp sync failed (subscriber saved locally):', mcErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
