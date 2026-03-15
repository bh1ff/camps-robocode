import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const PUBLIC_BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://camps.robocode.uk';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  const normalised = email.trim().toLowerCase();

  try {
    await prisma.subscriber.deleteMany({ where: { email: normalised } });

    if (process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_LIST_ID) {
      const dc = process.env.MAILCHIMP_API_KEY.split('-').pop();
      const crypto = await import('crypto');
      const hash = crypto.createHash('md5').update(normalised).digest('hex');
      try {
        await fetch(
          `https://${dc}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_LIST_ID}/members/${hash}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `apikey ${process.env.MAILCHIMP_API_KEY}`,
            },
            body: JSON.stringify({ status: 'unsubscribed' }),
          }
        );
      } catch { /* best effort */ }
    }

    return NextResponse.redirect(`${PUBLIC_BASE}/unsubscribe?done=1`);
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.redirect(`${PUBLIC_BASE}/unsubscribe?done=1`);
  }
}
