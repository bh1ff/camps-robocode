import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' },
      include: {
        camps: {
          include: {
            campDays: { orderBy: { date: 'asc' } },
            _count: { select: { bookings: true } },
            season: true,
          },
        },
      },
    });

    const safe = locations.map((loc) => ({
      ...loc,
      stripeSecretKey: loc.stripeSecretKey ? '••••' + loc.stripeSecretKey.slice(-4) : null,
      stripeConnected: !!loc.stripeSecretKey,
    }));

    return NextResponse.json(safe);
  } catch (error) {
    console.error('Get locations error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const location = await prisma.location.create({
      data: {
        name: data.name,
        slug,
        address: data.address || '',
        region: data.region,
        capacityPerDay: parseInt(data.capacityPerDay) || 30,
        hafSeatsTotal: parseInt(data.hafSeatsTotal) || 100,
        imageUrl: data.imageUrl || null,
        allowsPaid: data.allowsPaid ?? false,
        stripeSecretKey: data.stripeSecretKey || null,
        stripePublishableKey: data.stripePublishableKey || null,
        stripeWebhookSecret: data.stripeWebhookSecret || null,
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error('Create location error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
