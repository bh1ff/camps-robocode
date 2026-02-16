'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Camp {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  kidCount: number;
}

export default function HomePage() {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/superadmin/camps')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCamps(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center robo-gradient">
        <div className="w-12 h-12 border-4 border-[#00adb3] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen robo-gradient flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#00adb3] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-[#00d4db] rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="robo-card p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <img src="/mascot.png" alt="Robocode" className="w-24 h-24 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-heading text-[#003439] mb-2">ROBOCODE CAMP</h1>
          <p className="text-[#05575c] opacity-70">Camp Management System</p>
        </div>

        {camps.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-heading text-[#003439]">Select a Camp</h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {camps.map(camp => (
                <button
                  key={camp.id}
                  onClick={() => router.push(`/camp/${camp.id}`)}
                  className="w-full p-4 bg-[#f0f7f7] rounded-xl text-left hover:bg-[#00adb3]/10 transition-colors border-2 border-transparent hover:border-[#00adb3]"
                >
                  <h3 className="font-semibold text-[#003439]">{camp.name}</h3>
                  <p className="text-sm text-[#05575c]/70">
                    {new Date(camp.startDate).toLocaleDateString()} - {new Date(camp.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-[#05575c]/50 mt-1">{camp.kidCount} campers</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#00adb3]/10 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-[#00adb3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-heading text-[#003439] mb-2">No Camps Available</h3>
            <p className="text-sm text-[#05575c]/70 mb-4">
              Ask a Super Admin to create a camp
            </p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => router.push('/superadmin')}
            className="w-full py-3 px-4 rounded-xl font-semibold border-2 border-[#00adb3] text-[#00adb3] hover:bg-[#00adb3]/10 transition-colors"
          >
            Super Admin Access
          </button>
        </div>
      </div>
    </div>
  );
}
