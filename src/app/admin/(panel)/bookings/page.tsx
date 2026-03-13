'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Download, ChevronDown, ChevronUp, Check, X as XIcon, Clock } from 'lucide-react';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  schoolName: string | null;
  hafCode: string | null;
  hasSEND: boolean;
  hasAllergies: boolean;
  allergyDetails: string | null;
  dayBookings: { campDay: { dayLabel: string } }[];
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
  createdAt: string;
  children: Child[];
  camp: {
    name: string;
    location: { name: string } | null;
    season: { title: string } | null;
  };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', status: '', search: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (filter.type) params.set('type', filter.type);
    if (filter.status) params.set('status', filter.status);
    if (filter.search) params.set('search', filter.search);

    fetch(`/api/admin/bookings?${params}`)
      .then((r) => r.json())
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const exportCSV = () => {
    const rows = [['Parent', 'Email', 'Phone', 'Type', 'Status', 'Location', 'Children', 'Amount', 'Date']];
    bookings.forEach((b) => {
      rows.push([
        `${b.parentFirstName} ${b.parentLastName}`,
        b.parentEmail,
        b.parentPhone,
        b.type,
        b.status,
        b.camp.location?.name || b.camp.name,
        String(b.children.length),
        b.type === 'paid' ? `£${b.totalAmount}` : 'Free',
        new Date(b.createdAt).toLocaleDateString('en-GB'),
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const statusIcon = (status: string) => {
    if (status === 'confirmed') return <Check size={12} className="text-emerald-600" />;
    if (status === 'cancelled') return <XIcon size={12} className="text-red-500" />;
    return <Clock size={12} className="text-amber-500" />;
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#003439] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#003439]">Bookings</h1>
          <p className="text-sm text-[#05575c]/60 mt-1">{bookings.length} booking(s)</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] transition-colors">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05575c]/30" />
          <input
            type="text"
            value={filter.search}
            onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20"
            placeholder="Search by name or email..."
          />
        </div>
        <select value={filter.type} onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20">
          <option value="">All types</option>
          <option value="haf">HAF</option>
          <option value="paid">Paid</option>
        </select>
        <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20">
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <p className="text-[#05575c]/50">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {statusIcon(b.status)}
                    <span className="font-semibold text-sm text-[#003439]">{b.parentFirstName} {b.parentLastName}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      b.type === 'haf' ? 'bg-emerald-100 text-emerald-700' : 'bg-pink-100 text-pink-700'
                    }`}>{b.type}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700'
                      : b.status === 'cancelled' ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                    }`}>{b.status}</span>
                  </div>
                  <p className="text-xs text-[#05575c]/40 mt-0.5">
                    {b.camp.location?.name || b.camp.name} &middot; {b.children.length} child(ren) &middot; {new Date(b.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <span className="text-sm font-semibold text-[#003439]">
                  {b.type === 'paid' ? `£${b.totalAmount}` : 'Free'}
                </span>
                {expandedId === b.id ? <ChevronUp size={16} className="text-[#05575c]/30" /> : <ChevronDown size={16} className="text-[#05575c]/30" />}
              </button>

              {expandedId === b.id && (
                <div className="px-5 pb-4 border-t border-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 text-xs">
                    <div>
                      <span className="text-[#05575c]/40">Email</span>
                      <p className="font-medium text-[#003439]">{b.parentEmail}</p>
                    </div>
                    <div>
                      <span className="text-[#05575c]/40">Phone</span>
                      <p className="font-medium text-[#003439]">{b.parentPhone}</p>
                    </div>
                    <div>
                      <span className="text-[#05575c]/40">Address</span>
                      <p className="font-medium text-[#003439]">{b.address}, {b.postcode}</p>
                    </div>
                    {b.hafCode && (
                      <div>
                        <span className="text-[#05575c]/40">HAF Code</span>
                        <p className="font-medium text-[#003439]">{b.hafCode}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mt-2">
                    {b.children.map((child) => (
                      <div key={child.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-[#003439]">{child.firstName} {child.lastName}</span>
                          <span className="text-xs text-[#05575c]/40">Age {child.age}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          {child.schoolName && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{child.schoolName}</span>}
                          {child.hafCode && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">HAF: {child.hafCode}</span>}
                          {child.hasSEND && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">SEND</span>}
                          {child.hasAllergies && <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600">Allergies: {child.allergyDetails}</span>}
                        </div>
                        {child.dayBookings.length > 0 && (
                          <p className="text-[10px] text-[#05575c]/40 mt-1">
                            Days: {child.dayBookings.map((db) => db.campDay.dayLabel).join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    {b.status !== 'confirmed' && (
                      <button onClick={() => updateStatus(b.id, 'confirmed')} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600">
                        Confirm
                      </button>
                    )}
                    {b.status !== 'cancelled' && (
                      <button onClick={() => updateStatus(b.id, 'cancelled')} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600">
                        Cancel
                      </button>
                    )}
                    {b.status !== 'pending' && (
                      <button onClick={() => updateStatus(b.id, 'pending')} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-[#003439] hover:bg-gray-50">
                        Set Pending
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
