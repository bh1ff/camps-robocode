import { NextResponse } from 'next/server';
import { getActivePriceTiers } from '@/lib/pricing';

export async function GET() {
  try {
    const tiers = await getActivePriceTiers();
    return NextResponse.json(tiers);
  } catch (error) {
    console.error('Get pricing error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
