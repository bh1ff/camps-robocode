'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CapacityDay {
  campDayId: string;
  date: string;
  dayLabel: string;
  weekNumber: number;
  totalCapacity: number;
  booked: number;
  hafCount: number;
  paidCount: number;
  remaining: number;
}

interface LocationWithCapacity {
  location: {
    id: string;
    name: string;
    region: string;
    capacityPerDay: number;
    hafSeatsTotal: number;
    allowsPaid: boolean;
  };
  days: CapacityDay[];
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationWithCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('superadmin');
    if (!stored) {
      router.push('/superadmin');
      return;
    }
    loadLocations();
  }, [router]);

  const loadLocations = async () => {
    const locRes = await fetch('/api/locations');
    if (!locRes.ok) { setLoading(false); return; }
    const locs = await locRes.json();

    const withCapacity = await Promise.all(
      locs.map(async (loc: { id: string }) => {
        const capRes = await fetch(`/api/locations/${loc.id}/capacity`);
        if (capRes.ok) return capRes.json();
        return { location: loc, days: [] };
      })
    );

    setLocations(withCapacity);
    setLoading(false);
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
              <h1 className="text-xl font-heading text-white">LOCATIONS & CAPACITY</h1>
              <p className="text-white/60 text-sm">Easter 2026 Camp Availability</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {locations.map(({ location, days }) => {
          const totalBooked = days.reduce((sum, d) => sum + d.booked, 0);
          const totalCapacity = days.reduce((sum, d) => sum + d.totalCapacity, 0);
          const totalHaf = days.reduce((sum, d) => sum + d.hafCount, 0);
          const totalPaid = days.reduce((sum, d) => sum + d.paidCount, 0);

          return (
            <div key={location.id} className="robo-card overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-heading text-[#003439]">{location.name}</h2>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#ff9752]/15 text-[#7e2610] font-medium">
                        {location.region === 'solihull' ? 'Solihull' : 'Birmingham'}
                      </span>
                      <span className="text-xs text-[#05575c]/50">
                        {location.capacityPerDay} per day &bull; {location.hafSeatsTotal} HAF total
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-heading text-[#003439]">{totalBooked}</p>
                    <p className="text-xs text-[#05575c]/50">
                      / {totalCapacity} booked ({totalHaf} HAF, {totalPaid} paid)
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {days.map((day) => {
                    const fillPercent = day.totalCapacity > 0 ? (day.booked / day.totalCapacity) * 100 : 0;
                    const isFull = day.remaining <= 0;

                    return (
                      <div key={day.campDayId} className={`rounded-xl p-3 border-2 ${
                        isFull ? 'border-red-200 bg-red-50' : fillPercent > 70 ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100 bg-white'
                      }`}>
                        <p className="font-semibold text-sm text-[#003439]">{day.dayLabel.split(' ').slice(0, 2).join(' ')}</p>
                        <p className="text-xs text-[#05575c]/50">{day.dayLabel.split(' ').slice(2).join(' ')}</p>

                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isFull ? 'bg-red-400' : fillPercent > 70 ? 'bg-yellow-400' : 'bg-[#00dcde]'
                            }`}
                            style={{ width: `${Math.min(fillPercent, 100)}%` }}
                          />
                        </div>

                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-[#05575c]/50">{day.booked} booked</span>
                          <span className={`text-xs font-medium ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                            {isFull ? 'FULL' : `${day.remaining} left`}
                          </span>
                        </div>

                        {(day.hafCount > 0 || day.paidCount > 0) && (
                          <div className="flex gap-2 mt-1">
                            {day.hafCount > 0 && <span className="text-xs text-[#00adb3]">{day.hafCount} HAF</span>}
                            {day.paidCount > 0 && <span className="text-xs text-[#ff00bf]">{day.paidCount} paid</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
