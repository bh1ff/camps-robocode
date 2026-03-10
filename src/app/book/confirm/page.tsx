'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface BookingDetails {
  id: string;
  type: string;
  status: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  totalAmount: number;
  children: { firstName: string; lastName: string }[];
  camp: { name: string; location?: { name: string } };
}

function ConfirmContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const status = searchParams.get('status');
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    fetch(`/api/bookings/${bookingId}`)
      .then((res) => res.json())
      .then((data) => {
        setBooking(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f7f7]">
        <div className="w-12 h-12 border-4 border-[#00dcde] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isSuccess = status === 'success';
  const isCancelled = status === 'cancelled';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f7f7] p-4">
      <div className="robo-card p-8 max-w-lg w-full text-center">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-[#00dcde]/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-[#00dcde]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-heading text-[#003439] mb-3">PAYMENT SUCCESSFUL</h2>
            <p className="text-[#05575c] mb-6">
              Thank you{booking ? `, ${booking.parentFirstName}` : ''}! Your booking is confirmed.
            </p>

            {booking && (
              <div className="bg-[#f0f7f7] rounded-xl p-4 text-left text-sm space-y-1">
                <p><span className="font-semibold">Booking ID:</span> {booking.id.slice(0, 8).toUpperCase()}</p>
                <p><span className="font-semibold">Location:</span> {booking.camp.location?.name || booking.camp.name}</p>
                <p><span className="font-semibold">Children:</span> {booking.children.map(c => `${c.firstName} ${c.lastName}`).join(', ')}</p>
                <p><span className="font-semibold">Amount Paid:</span> £{booking.totalAmount.toFixed(2)}</p>
              </div>
            )}

            <p className="text-sm text-[#05575c]/70 mt-4">
              A confirmation email will be sent to {booking?.parentEmail || 'your email address'}.
            </p>
          </>
        ) : isCancelled ? (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-[#ff9752]/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-[#ff9752]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-heading text-[#003439] mb-3">PAYMENT CANCELLED</h2>
            <p className="text-[#05575c] mb-6">Your payment was not completed. Your booking is saved but not confirmed.</p>
            <a
              href="/book/paid"
              className="inline-block robo-btn px-6 py-3 rounded-xl font-semibold"
            >
              Try Again
            </a>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-heading text-[#003439] mb-3">BOOKING STATUS</h2>
            <p className="text-[#05575c]">Unable to determine booking status.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f0f7f7]">
        <div className="w-12 h-12 border-4 border-[#00dcde] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  );
}
