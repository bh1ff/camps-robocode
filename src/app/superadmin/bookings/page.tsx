'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BookingChild {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  hasSEND: boolean;
  hasEHCP: boolean;
  ehcpDetails: string | null;
  hasAllergies: boolean;
  allergyDetails: string | null;
  photoPermission: boolean;
  dayBookings: { campDay: { dayLabel: string; weekNumber: number } }[];
}

interface Booking {
  id: string;
  type: string;
  status: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  address: string;
  postcode: string;
  hafCode: string | null;
  totalAmount: number;
  children: BookingChild[];
  camp: { name: string; location: { name: string; region: string } | null };
  createdAt: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('superadmin');
    if (!stored) {
      router.push('/superadmin');
      return;
    }
    loadBookings();
  }, [router]);

  const loadBookings = async () => {
    const params = new URLSearchParams();
    if (filterType) params.set('type', filterType);
    if (filterStatus) params.set('status', filterStatus);

    const res = await fetch(`/api/bookings?${params}`);
    if (res.ok) {
      const data = await res.json();
      setBookings(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!loading) loadBookings();
  }, [filterType, filterStatus]);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      loadBookings();
      if (selectedBooking?.id === id) {
        setSelectedBooking((prev) => prev ? { ...prev, status } : null);
      }
    }
  };

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    totalChildren: bookings.reduce((sum, b) => sum + b.children.length, 0),
    hafCount: bookings.filter((b) => b.type === 'haf').length,
    paidCount: bookings.filter((b) => b.type === 'paid').length,
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f7f7]">
        <div className="w-12 h-12 border-4 border-[#00dcde] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f7f7]">
      <header className="robo-gradient shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/superadmin')} className="text-white/70 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-heading text-white">BOOKINGS</h1>
              <p className="text-white/60 text-sm">Manage all camp bookings</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="robo-card p-4">
            <p className="text-2xl font-heading text-[#003439]">{stats.total}</p>
            <p className="text-xs text-[#05575c]/70">Total Bookings</p>
          </div>
          <div className="robo-card p-4">
            <p className="text-2xl font-heading text-green-600">{stats.confirmed}</p>
            <p className="text-xs text-[#05575c]/70">Confirmed</p>
          </div>
          <div className="robo-card p-4">
            <p className="text-2xl font-heading text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-[#05575c]/70">Pending</p>
          </div>
          <div className="robo-card p-4">
            <p className="text-2xl font-heading text-[#003439]">{stats.totalChildren}</p>
            <p className="text-xs text-[#05575c]/70">Total Children</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 items-center justify-between">
          <div className="flex gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-white text-[#003439] text-sm"
            >
              <option value="">All Types</option>
              <option value="haf">HAF</option>
              <option value="paid">Paid</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-white text-[#003439] text-sm"
            >
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a
              href="/api/export/haf?format=council"
              className="px-3 py-2 text-xs bg-[#003439] text-white rounded-lg hover:bg-[#003439]/90 transition-colors font-semibold"
            >
              Council Register
            </a>
            <a
              href="/api/export/haf"
              className="px-3 py-2 text-xs bg-[#00dcde]/15 text-[#003439] rounded-lg hover:bg-[#00dcde]/25 transition-colors font-semibold"
            >
              HAF Full Export
            </a>
            <a
              href="/api/export/ehcp"
              className="px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-semibold"
            >
              EHCP Report
            </a>
            <a
              href="/api/export/allergies"
              className="px-3 py-2 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-semibold"
            >
              Allergies
            </a>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="robo-card p-12 text-center">
            <h3 className="text-xl font-heading text-[#003439] mb-2">No Bookings Yet</h3>
            <p className="text-[#05575c]/70 mb-4">Bookings will appear here when parents register through the booking forms.</p>
            <div className="flex gap-3 justify-center">
              <a href="/book/haf" target="_blank" className="robo-btn px-4 py-2 rounded-lg text-sm font-semibold">HAF Form</a>
              <a href="/book/paid" target="_blank" className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#ff00bf] text-white">Paid Form</a>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="robo-card p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-bold text-[#003439]">
                        {booking.parentFirstName} {booking.parentLastName}
                      </p>
                      <p className="text-sm text-[#05575c]/70">{booking.parentEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      booking.type === 'haf' ? 'bg-[#00dcde]/15 text-[#003439]' : 'bg-[#ff00bf]/10 text-[#98036c]'
                    }`}>
                      {booking.type.toUpperCase()}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    <span className="text-sm text-[#05575c]/50">
                      {booking.children.length} child{booking.children.length !== 1 ? 'ren' : ''}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <span className="text-xs text-[#05575c]/50">{booking.camp.location?.name || booking.camp.name}</span>
                  <span className="text-xs text-[#05575c]/30">|</span>
                  <span className="text-xs text-[#05575c]/50">{new Date(booking.createdAt).toLocaleString()}</span>
                  {booking.totalAmount > 0 && (
                    <>
                      <span className="text-xs text-[#05575c]/30">|</span>
                      <span className="text-xs font-medium text-[#ff00bf]">£{booking.totalAmount.toFixed(2)}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBooking(null)}>
          <div className="robo-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-heading text-[#003439]">BOOKING DETAILS</h2>
                <p className="text-xs text-[#05575c]/50">ID: {selectedBooking.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedBooking.type === 'haf' ? 'bg-[#00dcde]/15 text-[#003439]' : 'bg-[#ff00bf]/10 text-[#98036c]'
                }`}>
                  {selectedBooking.type.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(selectedBooking.status)}`}>
                  {selectedBooking.status}
                </span>
              </div>

              <div className="bg-[#f0f7f7] rounded-xl p-4">
                <h3 className="text-xs font-heading text-[#05575c]/50 mb-2">PARENT / GUARDIAN</h3>
                <p className="font-bold text-[#003439]">{selectedBooking.parentFirstName} {selectedBooking.parentLastName}</p>
                <p className="text-sm text-[#05575c]">{selectedBooking.parentEmail}</p>
                <p className="text-sm text-[#05575c]">{selectedBooking.parentPhone}</p>
                <p className="text-sm text-[#05575c]">{selectedBooking.address}, {selectedBooking.postcode}</p>
                {selectedBooking.hafCode && (
                  <p className="text-sm mt-1"><span className="font-medium">HAF Code:</span> {selectedBooking.hafCode}</p>
                )}
              </div>

              {selectedBooking.children.map((child, i) => (
                <div key={child.id} className="bg-[#f0f7f7] rounded-xl p-4">
                  <h3 className="text-xs font-heading text-[#05575c]/50 mb-2">CHILD {i + 1}</h3>
                  <p className="font-bold text-[#003439]">{child.firstName} {child.lastName}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-[#05575c] mt-1">
                    <p>Age: {child.age}</p>
                    <p>SEND: {child.hasSEND ? 'Yes' : 'No'}</p>
                    {child.hasEHCP && <p>EHCP: Yes {child.ehcpDetails ? `(${child.ehcpDetails})` : ''}</p>}
                    <p>Allergies: {child.hasAllergies ? child.allergyDetails : 'None'}</p>
                    <p>Photo: {child.photoPermission ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {child.dayBookings.map((db, di) => (
                      <span key={di} className="robo-badge text-xs">{db.campDay.dayLabel}</span>
                    ))}
                  </div>
                </div>
              ))}

              {selectedBooking.totalAmount > 0 && (
                <div className="bg-gradient-to-r from-[#fff0fd] to-[#fff6ed] rounded-xl p-4">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#003439]">Amount</span>
                    <span className="text-xl font-heading text-[#ff00bf]">£{selectedBooking.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                {selectedBooking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateStatus(selectedBooking.id, 'confirmed')}
                      className="flex-1 py-2.5 px-4 rounded-xl font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => updateStatus(selectedBooking.id, 'cancelled')}
                      className="flex-1 py-2.5 px-4 rounded-xl font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <button
                    onClick={() => updateStatus(selectedBooking.id, 'cancelled')}
                    className="py-2.5 px-4 rounded-xl font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  >
                    Cancel Booking
                  </button>
                )}
                {selectedBooking.status === 'cancelled' && (
                  <button
                    onClick={() => updateStatus(selectedBooking.id, 'confirmed')}
                    className="py-2.5 px-4 rounded-xl font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                  >
                    Re-confirm
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
