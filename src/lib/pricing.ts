const PRICE_TIERS = [
  { days: 8, price: 14000 },
  { days: 4, price: 7500 },
  { days: 2, price: 4000 },
  { days: 1, price: 2500 },
] as const;

export function calculatePrice(totalDays: number): {
  totalPence: number;
  breakdown: { tier: number; count: number; subtotal: number }[];
} {
  if (totalDays <= 0) return { totalPence: 0, breakdown: [] };

  let remaining = totalDays;
  const breakdown: { tier: number; count: number; subtotal: number }[] = [];

  for (const { days, price } of PRICE_TIERS) {
    const count = Math.floor(remaining / days);
    if (count > 0) {
      breakdown.push({ tier: days, count, subtotal: count * price });
      remaining -= count * days;
    }
  }

  const totalPence = breakdown.reduce((sum, b) => sum + b.subtotal, 0);
  return { totalPence, breakdown };
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

export function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function formatPriceWhole(pence: number): string {
  const pounds = pence / 100;
  return pounds % 1 === 0 ? `£${pounds}` : `£${pounds.toFixed(2)}`;
}
