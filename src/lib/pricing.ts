import prisma from '@/lib/db';

const FALLBACK_TIERS = [
  { days: 8, pricePence: 14000 },
  { days: 4, pricePence: 7500 },
  { days: 2, pricePence: 4000 },
  { days: 1, pricePence: 2500 },
];

export interface PriceTierData {
  days: number;
  pricePence: number;
}

export async function getActivePriceTiers(): Promise<PriceTierData[]> {
  try {
    const activeSeason = await prisma.season.findFirst({
      where: { active: true },
      include: { priceTiers: { orderBy: { days: 'desc' } } },
    });

    if (activeSeason && activeSeason.priceTiers.length > 0) {
      return activeSeason.priceTiers.map((t) => ({ days: t.days, pricePence: t.pricePence }));
    }

    return FALLBACK_TIERS;
  } catch {
    return FALLBACK_TIERS;
  }
}

export function calculatePriceWithTiers(
  totalDays: number,
  tiers: PriceTierData[]
): { totalPence: number; breakdown: { tier: number; count: number; subtotal: number }[] } {
  if (totalDays <= 0) return { totalPence: 0, breakdown: [] };

  const sorted = [...tiers].sort((a, b) => b.days - a.days);
  let remaining = totalDays;
  const breakdown: { tier: number; count: number; subtotal: number }[] = [];

  for (const { days, pricePence } of sorted) {
    const count = Math.floor(remaining / days);
    if (count > 0) {
      breakdown.push({ tier: days, count, subtotal: count * pricePence });
      remaining -= count * days;
    }
  }

  const totalPence = breakdown.reduce((sum, b) => sum + b.subtotal, 0);
  return { totalPence, breakdown };
}

export function calculatePrice(totalDays: number): {
  totalPence: number;
  breakdown: { tier: number; count: number; subtotal: number }[];
} {
  return calculatePriceWithTiers(totalDays, FALLBACK_TIERS);
}

export function calculateBookingTotal(
  daysPerChild: number[],
): { totalPence: number; perChild: { days: number; pence: number }[] } {
  const perChild = daysPerChild.map((days) => {
    const { totalPence } = calculatePrice(days);
    return { days, pence: totalPence };
  });
  const totalPence = perChild.reduce((sum, c) => sum + c.pence, 0);
  return { totalPence, perChild };
}

export function calculateBookingTotalWithTiers(
  daysPerChild: number[],
  tiers: PriceTierData[]
): { totalPence: number; perChild: { days: number; pence: number }[] } {
  const perChild = daysPerChild.map((days) => {
    const { totalPence } = calculatePriceWithTiers(days, tiers);
    return { days, pence: totalPence };
  });
  const totalPence = perChild.reduce((sum, c) => sum + c.pence, 0);
  return { totalPence, perChild };
}

export function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function formatPriceWhole(pence: number): string {
  const pounds = pence / 100;
  return pounds % 1 === 0 ? `£${pounds}` : `£${pounds.toFixed(2)}`;
}
