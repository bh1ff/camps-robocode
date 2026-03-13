'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Users, CreditCard, MapPin, ClipboardList, TrendingUp } from 'lucide-react';

interface DashboardData {
  stats: {
    totalBookings: number;
    confirmedBookings: number;
    pendingBookings: number;
    totalChildren: number;
    totalRevenue: number;
    locations: number;
  };
  activeSeason: {
    title: string;
    camps: { id: string; name: string; _count: { bookings: number } }[];
  } | null;
  recentBookings: {
    id: string;
    type: string;
    status: string;
    parentFirstName: string;
    parentLastName: string;
    parentEmail: string;
    totalAmount: number;
    createdAt: string;
    children: { id: string; firstName: string; lastName: string }[];
    camp: { name: string; location: { name: string } | null };
  }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#003439] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { stats, activeSeason, recentBookings } = data;

  const statCards = [
    { label: 'Total Bookings', value: stats.totalBookings, icon: ClipboardList, color: 'bg-blue-50 text-blue-600' },
    { label: 'Confirmed', value: stats.confirmedBookings, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Pending', value: stats.pendingBookings, icon: CalendarDays, color: 'bg-amber-50 text-amber-600' },
    { label: 'Children', value: stats.totalChildren, icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: 'Revenue', value: `£${stats.totalRevenue.toFixed(0)}`, icon: CreditCard, color: 'bg-pink-50 text-pink-600' },
    { label: 'Locations', value: stats.locations, icon: MapPin, color: 'bg-cyan-50 text-cyan-600' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#003439]">Dashboard</h1>
        {activeSeason && (
          <p className="text-sm text-[#05575c]/60 mt-1">
            Active season: <span className="font-semibold text-[#003439]">{activeSeason.title}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center mb-2`}>
              <card.icon size={16} />
            </div>
            <p className="text-xl font-bold text-[#003439]">{card.value}</p>
            <p className="text-xs text-[#05575c]/50">{card.label}</p>
          </div>
        ))}
      </div>

      {activeSeason && activeSeason.camps.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h2 className="text-sm font-bold text-[#003439] mb-3">Camps This Season</h2>
          <div className="space-y-2">
            {activeSeason.camps.map((camp) => (
              <div key={camp.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-[#003439]">{camp.name}</span>
                <span className="text-xs text-[#05575c]/50">{camp._count.bookings} bookings</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-[#003439] mb-3">Recent Bookings</h2>
        {recentBookings.length === 0 ? (
          <p className="text-sm text-[#05575c]/50 py-4 text-center">No bookings yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-[#05575c]/50 border-b border-gray-100">
                  <th className="text-left py-2 font-medium">Parent</th>
                  <th className="text-left py-2 font-medium">Location</th>
                  <th className="text-left py-2 font-medium">Type</th>
                  <th className="text-left py-2 font-medium">Children</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-right py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5">
                      <p className="font-medium text-[#003439]">{b.parentFirstName} {b.parentLastName}</p>
                      <p className="text-xs text-[#05575c]/40">{b.parentEmail}</p>
                    </td>
                    <td className="py-2.5 text-[#05575c]/70">{b.camp.location?.name || b.camp.name}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        b.type === 'haf' ? 'bg-emerald-100 text-emerald-700' : 'bg-pink-100 text-pink-700'
                      }`}>
                        {b.type}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#05575c]/70">{b.children.length}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700'
                        : b.status === 'cancelled' ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-medium text-[#003439]">
                      {b.type === 'paid' ? `£${b.totalAmount}` : 'Free'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
