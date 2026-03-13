import { Suspense } from 'react';
import BookingWizard from '@/components/booking/BookingWizard';

export const metadata = {
  title: 'Book a Spot - Robocode Holiday Tech Camp',
  description: 'Book your paid spot at Robocode Holiday Tech Camp Easter 2026',
};

export default function PaidBookingPage() {
  return (
    <Suspense>
      <BookingWizard bookingType="paid" />
    </Suspense>
  );
}
