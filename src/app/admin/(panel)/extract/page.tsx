'use client';

import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, Users, CheckCircle } from 'lucide-react';

interface SessionStat {
  id: string;
  name: string;
  time: string;
  attended: number;
}

interface GroupStat {
  name: string;
  color: string;
  ageRange: string;
  total: number;
  checkedIn: number;
}

interface CampStat {
  id: string;
  name: string;
  date: string;
  location: string;
  season: string;
  totalKids: number;
  checkedIn: number;
  checkedOut: number;
  sessions: SessionStat[];
  groups: GroupStat[];
}

const BAND_COLORS: Record<string, string> = {
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
};

export default function ExtractDataPage() {
  const [camps, setCamps] = useState<CampStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/extract')
      .then((r) => r.json())
      .then(setCamps)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#003439] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Group camps by location
  const byLocation: Record<string, CampStat[]> = {};
  for (const camp of camps) {
    if (!byLocation[camp.location]) byLocation[camp.location] = [];
    byLocation[camp.location].push(camp);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#003439]">Extract Data</h1>
        <p className="text-sm text-[#05575c]/60 mt-1">
          Download attendance and check-in data for each camp day
        </p>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <FileSpreadsheet size={16} />
          </div>
          <p className="text-xl font-bold text-[#003439]">{camps.length}</p>
          <p className="text-xs text-[#05575c]/50">Camp Days</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
            <Users size={16} />
          </div>
          <p className="text-xl font-bold text-[#003439]">
            {camps.reduce((sum, c) => sum + c.totalKids, 0)}
          </p>
          <p className="text-xs text-[#05575c]/50">Total Registrations</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <CheckCircle size={16} />
          </div>
          <p className="text-xl font-bold text-[#003439]">
            {camps.reduce((sum, c) => sum + c.checkedIn, 0)}
          </p>
          <p className="text-xs text-[#05575c]/50">Total Checked In</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
            <Download size={16} />
          </div>
          <p className="text-xl font-bold text-[#003439]">
            {camps.reduce((sum, c) => sum + c.checkedOut, 0)}
          </p>
          <p className="text-xs text-[#05575c]/50">Total Collected</p>
        </div>
      </div>

      {/* Camps by Location */}
      {Object.entries(byLocation).map(([location, locationCamps]) => (
        <div key={location} className="mb-6">
          <h2 className="text-lg font-bold text-[#003439] mb-3">{location}</h2>
          <div className="space-y-3">
            {locationCamps.map((camp) => {
              const isExpanded = expanded === camp.id;
              const date = new Date(camp.date).toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
              });
              const attendanceRate = camp.totalKids > 0
                ? Math.round((camp.checkedIn / camp.totalKids) * 100) : 0;

              return (
                <div key={camp.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  {/* Camp header - always visible */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : camp.id)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold text-[#003439]">{camp.name}</h3>
                        <p className="text-xs text-[#05575c]/60">{date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#003439]">{camp.checkedIn}/{camp.totalKids}</p>
                        <p className="text-xs text-[#05575c]/50">checked in ({attendanceRate}%)</p>
                      </div>
                      <a
                        href={`/api/admin/extract/${camp.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003439] text-white text-xs font-medium rounded-lg hover:bg-[#004a50] transition-colors"
                      >
                        <Download size={12} />
                        CSV
                      </a>
                      <svg
                        className={`w-4 h-4 text-[#05575c]/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 space-y-4">
                      {/* Session attendance */}
                      <div>
                        <h4 className="text-xs font-bold text-[#05575c]/50 uppercase mb-2">Session Attendance</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {camp.sessions.map((session) => {
                            const pct = camp.totalKids > 0 ? Math.round((session.attended / camp.totalKids) * 100) : 0;
                            return (
                              <div key={session.id} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-semibold text-[#003439]">{session.name}</span>
                                  <span className="text-xs text-[#05575c]/60">{session.time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-emerald-500 h-2 rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-[#003439]">
                                    {session.attended}/{camp.totalKids} ({pct}%)
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Group breakdown */}
                      <div>
                        <h4 className="text-xs font-bold text-[#05575c]/50 uppercase mb-2">Group Breakdown</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                          {camp.groups.map((group) => (
                            <div key={group.name} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`w-3 h-3 rounded-full ${BAND_COLORS[group.color] || 'bg-gray-400'}`} />
                                <span className="text-sm font-semibold text-[#003439]">Group {group.name}</span>
                              </div>
                              <p className="text-xs text-[#05575c]/60 capitalize mb-1">{group.color} band | {group.ageRange}</p>
                              <p className="text-sm font-bold text-[#003439]">
                                {group.checkedIn}/{group.total} checked in
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {camps.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-[#05575c]/50">No camp data found</p>
        </div>
      )}
    </div>
  );
}
