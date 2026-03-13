import { Suspense } from 'react';
import BookingWizard from '@/components/booking/BookingWizard';

export const metadata = {
  title: 'HAF Booking - Robocode Holiday Tech Camp',
  description: 'Book your free HAF-funded spot at Robocode Holiday Tech Camp Easter 2026',
};

export default function HafBookingPage() {
  return (
    <Suspense>
      <BookingWizard bookingType="haf" />
    </Suspense>
  );
}
