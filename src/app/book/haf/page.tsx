import { Suspense } from 'react';
import type { Metadata } from 'next';
import BookingWizard from '@/components/booking/BookingWizard';
import prisma from '@/lib/db';

export async function generateMetadata(): Promise<Metadata> {
  const season = await prisma.season.findFirst({ where: { active: true }, select: { title: true } }).catch(() => null);
  const title = season?.title || 'Holiday Tech Camp';
  return {
    title: 'HAF Booking - Robocode Holiday Tech Camp',
    description: `Book your free HAF-funded spot at Robocode Holiday Tech Camp ${title}`,
  };
}

export default function HafBookingPage() {
  return (
    <Suspense>
      <BookingWizard bookingType="haf" />
    </Suspense>
  );
}
