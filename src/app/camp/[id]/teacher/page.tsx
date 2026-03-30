'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';

interface Kid {
  id: string;
  name: string;
  age: number;
  allergies: string;
  hasSEND: boolean;
  hasEHCP: boolean;
  checkedIn: boolean;
  checkedOut: boolean;
  attended: string[];
  days: string[];
}

interface Group {
  ageRange: string;
  color: string;
  kids: Kid[];
}

interface Area {
  id: string;
  name: string;
  type: string;
}

interface Session {
  id: string;
  name: string;
  time: string;
}

interface CampData {
  groups: Record<string, Group>;
  schedule: {
    sessions: Session[];
    areas: Area[];
    rotation: Record<string, string[]>;
    lunch: { time: string };
  };
}

function getAreaTypeBgLight(type: string): string {
  switch (type) {
    case 'mechanical': return 'bg-blue-200 text-blue-900 border border-blue-400';
    case 'electronic': return 'bg-amber-200 text-amber-900 border border-amber-400';
    case 'physical': return 'bg-emerald-200 text-emerald-900 border border-emerald-400';
    default: return 'bg-gray-200 text-gray-800 border border-gray-400';
  }
}

export default function CampTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: campId } = use(params);
  const [data, setData] = useState<CampData | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'areas' | 'groups'>('areas');
  const router = useRouter();

  const loadData = useCallback(async () => {
    const res = await fetch(`/api/camps/${campId}`);
    if (res.ok) {
      const campData = await res.json();
      setData(campData);
    }
  }, [campId]);

  useEffect(() => {
    const auth = localStorage.getItem(`camp_${campId}_auth`);
    if (!auth) {
      router.push(`/camp/${campId}`);
      return;
    }
    loadData();

    // Auto-refresh every 15 seconds to pick up check-ins from admin
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [campId, router, loadData]);

  const handleLogout = () => {
    localStorage.removeItem(`camp_${campId}_auth`);
    router.push(`/camp/${campId}`);
  };

  const handleToggleAttendance = async (kidId: string, sessionOrder: number) => {
    const sessionId = `session-${sessionOrder}`;
    let isAttended = false;

    // Find if kid is currently attended
    for (const group of Object.values(data?.groups || {})) {
      const kid = group.kids.find(k => k.id === kidId);
      if (kid) {
        isAttended = kid.attended.includes(sessionId);
        break;
      }
    }

    await fetch(`/api/camps/${campId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kidId, sessionOrder, attended: !isAttended }),
    });
    loadData();
  };

  const markAllAttendance = async (groupName: string, sessionOrder: number, markPresent: boolean) => {
    await fetch(`/api/camps/${campId}/attendance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupName, sessionOrder, markPresent }),
    });
    loadData();
  };

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center robo-gradient">
      <div className="w-12 h-12 border-4 border-[#00adb3] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const getGroupSchedule = (groupId: string) => {
    const rotation = data.schedule.rotation[groupId] || [];
    return rotation.map((areaId, idx) => ({
      session: data.schedule.sessions[idx]?.name || '',
      time: data.schedule.sessions[idx]?.time || '',
      area: data.schedule.areas.find(a => a.id === areaId) || { id: '', name: '', type: '' },
    }));
  };

  const getAreaSchedule = (areaId: string) => {
    const result: { session: string; time: string; groups: string[] }[] = [];

    data.schedule.sessions.forEach((session, sessionIdx) => {
      const groups: string[] = [];
      Object.entries(data.schedule.rotation).forEach(([groupId, rotation]) => {
        if (rotation[sessionIdx] === areaId) {
          groups.push(groupId);
        }
      });
      if (groups.length > 0) {
        result.push({
          session: session.name,
          time: session.time,
          groups,
        });
      }
    });

    return result;
  };

  return (
    <div className="min-h-screen bg-[#f0f7f7]">
      {/* Header */}
      <header className="robo-gradient shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Robocode" className="h-10 object-contain" />
            <div>
              <h1 className="text-xl font-heading text-white">ROBOCODE CAMP</h1>
              <p className="text-white/60 text-sm">Teacher View</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* View Toggle */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex gap-2 robo-card p-1.5">
          <button
            onClick={() => setViewMode('areas')}
            className={`flex-1 py-2.5 px-4 rounded-xl transition-all font-semibold ${
              viewMode === 'areas'
                ? 'robo-gradient-light text-white shadow-md'
                : 'text-[#05575c] hover:bg-[#00adb3]/10'
            }`}
          >
            By Area
          </button>
          <button
            onClick={() => setViewMode('groups')}
            className={`flex-1 py-2.5 px-4 rounded-xl transition-all font-semibold ${
              viewMode === 'groups'
                ? 'robo-gradient-light text-white shadow-md'
                : 'text-[#05575c] hover:bg-[#00adb3]/10'
            }`}
          >
            By Group
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === 'areas' && (
          <div className="space-y-6">
            {/* Area Selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.schedule.areas.map(area => (
                <button
                  key={area.id}
                  onClick={() => setSelectedArea(selectedArea === area.id ? null : area.id)}
                  className={`robo-card p-4 text-left transition-all ${
                    selectedArea === area.id ? 'ring-2 ring-[#00adb3] shadow-lg' : 'hover:shadow-md'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center ${getAreaTypeBgLight(area.type)}`}>
                    {area.type === 'robotics' && (
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {area.type === 'gamedev' && (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    )}
                    {area.type === '3dprinting' && (
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                      </svg>
                    )}
                    {area.type === 'game' && (
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {area.type === 'mechanical' && (
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                    {area.type === 'electronic' && (
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    {area.type === 'physical' && (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    )}
                  </div>
                  <h3 className="font-heading text-[#003439]">{area.name}</h3>
                  <p className="text-sm text-[#05575c]/60 capitalize">{area.type.replace('3d', '3D ')}</p>
                </button>
              ))}
            </div>

            {/* Selected Area Schedule with Attendance */}
            {selectedArea && (
              <div className="robo-card p-6">
                <h2 className="text-xl font-heading text-[#003439] mb-2">
                  {data.schedule.areas.find(a => a.id === selectedArea)?.name} - Attendance
                </h2>
                <p className="text-sm text-[#05575c]/60 mb-4">Tap on a student to toggle attendance</p>
                <div className="space-y-4">
                  {getAreaSchedule(selectedArea).map((slot, sessionIdx) => {
                    const sessionOrder = sessionIdx + 1;
                    const sessionId = `session-${sessionOrder}`;
                    return (
                      <div key={sessionIdx} className="border border-[#00adb3]/20 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-heading text-[#003439]">{slot.session}</h3>
                            <p className="text-sm text-[#05575c]/60">{slot.time}</p>
                          </div>
                          <span className="robo-badge">{slot.groups.length} groups</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {slot.groups.map(groupId => {
                            const group = data.groups[groupId];
                            const attendedCount = group.kids.filter(k => k.attended.includes(sessionId)).length;
                            return (
                              <div key={groupId} className="bg-[#f0f7f7] rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-[#003439]">
                                    Group {groupId} <span className="font-normal text-[#05575c]/60">({group.ageRange})</span>
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-[#05575c]/60">{attendedCount}/{group.kids.length}</span>
                                    <button
                                      onClick={() => markAllAttendance(groupId, sessionOrder, true)}
                                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                                    >
                                      All
                                    </button>
                                    <button
                                      onClick={() => markAllAttendance(groupId, sessionOrder, false)}
                                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                                    >
                                      Clear
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                  {group.kids.map(kid => {
                                    const isAttended = kid.attended.includes(sessionId);
                                    return (
                                      <button
                                        key={kid.id}
                                        onClick={() => handleToggleAttendance(kid.id, sessionOrder)}
                                        className={`w-full text-sm flex items-center justify-between p-2 rounded-lg transition-all ${
                                          isAttended ? 'bg-green-100 border-2 border-green-300' : 'bg-white border-2 border-transparent hover:border-gray-200'
                                        }`}
                                      >
                                        <span className="text-[#003439] flex items-center gap-2">
                                          {!kid.checkedIn && (
                                            <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" title="Not checked in" />
                                          )}
                                          {kid.name}{kid.days?.length > 0 && <span className="text-[#05575c]/50 text-xs ml-0.5">({kid.days.join(', ')})</span>}
                                          {kid.allergies && (
                                            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                                              {kid.allergies}
                                            </span>
                                          )}
                                        </span>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isAttended ? 'bg-green-500' : 'bg-gray-200'}`}>
                                          {isAttended ? (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                          ) : (
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Check-in summary */}
            {(() => {
              const allKids = Object.values(data.groups).flatMap(g => g.kids);
              const checkedInCount = allKids.filter(k => k.checkedIn).length;
              return (
                <div className="robo-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-heading text-[#003439]">Check-In Status</h3>
                      <p className="text-sm text-[#05575c]/70">{checkedInCount} of {allKids.length} campers checked in</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${allKids.length > 0 ? (checkedInCount / allKids.length) * 100 : 0}%` }}></div>
                    </div>
                    <span className="text-sm font-semibold text-[#003439]">{allKids.length > 0 ? Math.round((checkedInCount / allKids.length) * 100) : 0}%</span>
                  </div>
                </div>
              );
            })()}

            {/* Lunch Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading text-[#003439]">Lunch Break</h3>
                <p className="text-sm text-[#05575c]/70">{data.schedule.lunch.time} - All groups</p>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'groups' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(data.groups).map(([groupId, group]) => (
              <div key={groupId} className="robo-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-heading text-[#003439]">Group {groupId}</h3>
                    <p className="text-sm text-[#05575c]/60">Ages {group.ageRange} | {group.kids.length} campers</p>
                  </div>
                  <span className="robo-badge">{group.kids.length}</span>
                </div>

                {/* Schedule with attendance toggle */}
                <div className="space-y-2 mb-4">
                  {getGroupSchedule(groupId).map((slot, idx) => {
                    const sessionOrder = idx + 1;
                    const sessionId = `session-${sessionOrder}`;
                    const attendedCount = group.kids.filter(k => k.attended.includes(sessionId)).length;
                    return (
                      <details key={idx} className="group">
                        <summary className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${getAreaTypeBgLight(slot.area.type)}`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-semibold text-[#003439]">{slot.session}</span>
                              <p className="text-sm text-[#003439]/80">{slot.area.name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-[#05575c]/60">{slot.time}</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                attendedCount === group.kids.length ? 'bg-green-500 text-white' :
                                attendedCount > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {attendedCount}/{group.kids.length}
                              </span>
                            </div>
                          </div>
                        </summary>
                        <div className="mt-2 p-3 bg-white rounded-xl border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-[#05575c]/60">Tap to toggle attendance</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => markAllAttendance(groupId, sessionOrder, true)}
                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                              >
                                Mark All
                              </button>
                              <button
                                onClick={() => markAllAttendance(groupId, sessionOrder, false)}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {group.kids.map(kid => {
                              const isAttended = kid.attended.includes(sessionId);
                              return (
                                <button
                                  key={kid.id}
                                  onClick={() => handleToggleAttendance(kid.id, sessionOrder)}
                                  className={`w-full text-sm flex items-center justify-between p-2 rounded-lg transition-all ${
                                    isAttended ? 'bg-green-100 border-2 border-green-300' : 'bg-[#f0f7f7] border-2 border-transparent hover:border-gray-200'
                                  }`}
                                >
                                  <span className="text-[#003439] flex items-center gap-2">
                                    {!kid.checkedIn && (
                                      <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" title="Not checked in" />
                                    )}
                                    {kid.name}
                                    {kid.allergies && (
                                      <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                                        {kid.allergies}
                                      </span>
                                    )}
                                  </span>
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isAttended ? 'bg-green-500' : 'bg-gray-200'}`}>
                                    {isAttended ? (
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </details>
                    );
                  })}
                  <div className="p-3 rounded-xl border bg-yellow-50 border-yellow-200">
                    <div className="flex justify-between">
                      <span className="font-semibold text-[#003439]">Lunch</span>
                      <span className="text-sm text-[#05575c]/60">{data.schedule.lunch.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
