import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const [regions, locations] = await Promise.all([
      prisma.region.findMany({ orderBy: { name: 'asc' } }),
      prisma.location.findMany({
        include: {
          camps: {
            select: { id: true, name: true, active: true, season: { select: { title: true, active: true } }, _count: { select: { bookings: true } } },
          },
        },
      }),
    ]);

    const result = regions.map((r) => ({
      ...r,
      locations: locations
        .filter((l) => l.region.toLowerCase() === r.slug)
        .map((l) => ({
          ...l,
          stripeConnected: !!l.stripeSecretKey,
          stripeSecretKey: l.stripeSecretKey ? `••••${l.stripeSecretKey.slice(-4)}` : null,
        })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get regions error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const slug = (data.slug || data.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const region = await prisma.region.create({
      data: {
        name: data.name,
        slug,
      },
    });
    return NextResponse.json(region, { status: 201 });
  } catch (error) {
    console.error('Create region error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
