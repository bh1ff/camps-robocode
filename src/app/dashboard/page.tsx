'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredAuth, clearStoredAuth } from '@/lib/auth';
import { loadData, searchKids, updateKid, resetData, saveData, getAllKids } from '@/lib/dataStore';
import { getGroupSchedule, getAreaTypeBgLight } from '@/lib/schedule';
import { CampData, Kid } from '@/lib/types';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';

export default function DashboardPage() {
  const [data, setData] = useState<CampData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ kid: Kid; groupId: string }[]>([]);
  const [selectedKid, setSelectedKid] = useState<{ kid: Kid; groupId: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'search' | 'groups' | 'schedule'>('overview');
  const [scheduleModal, setScheduleModal] = useState<{ groupId: string; sessionIndex: number } | null>(null);
  const [allKids, setAllKids] = useState<{ kid: Kid; groupId: string }[]>([]);
  const [showResetWarning, setShowResetWarning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = getStoredAuth();
    if (!auth.authenticated || auth.role !== 'admin') {
      router.push('/');
      return;
    }
    const loadedData = loadData();
    setData(loadedData);
    setAllKids(getAllKids());
  }, [router]);

  // Refresh allKids when data changes
  useEffect(() => {
    if (data) {
      setAllKids(getAllKids());
    }
  }, [data]);

  // Sync data when changed in another tab (e.g., teacher view)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'campData') {
        setData(loadData());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      setSearchResults(searchKids(searchQuery));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleLogout = () => {
    clearStoredAuth();
    router.push('/');
  };

  const handleCheckIn = (kidId: string) => {
    const newData = updateKid(kidId, { checkedIn: true });
    setData(newData);
    if (selectedKid && selectedKid.kid.id === kidId) {
      setSelectedKid({ ...selectedKid, kid: { ...selectedKid.kid, checkedIn: true } });
    }
    setSearchResults(prev => prev.map(r =>
      r.kid.id === kidId ? { ...r, kid: { ...r.kid, checkedIn: true } } : r
    ));
  };

  const handleCheckOut = (kidId: string) => {
    const newData = updateKid(kidId, { checkedOut: true });
    setData(newData);
    if (selectedKid && selectedKid.kid.id === kidId) {
      setSelectedKid({ ...selectedKid, kid: { ...selectedKid.kid, checkedOut: true } });
    }
    setSearchResults(prev => prev.map(r =>
      r.kid.id === kidId ? { ...r, kid: { ...r.kid, checkedOut: true } } : r
    ));
  };

  const handleAllergyUpdate = (kidId: string, allergies: string) => {
    const newData = updateKid(kidId, { allergies });
    setData(newData);
    if (selectedKid && selectedKid.kid.id === kidId) {
      setSelectedKid({ ...selectedKid, kid: { ...selectedKid.kid, allergies } });
    }
  };

  const handleToggleAttendance = (kidId: string, sessionId: string) => {
    if (!selectedKid) return;

    const currentAttended = selectedKid.kid.attended || [];
    const isAttended = currentAttended.includes(sessionId);
    const newAttended = isAttended
      ? currentAttended.filter(s => s !== sessionId)
      : [...currentAttended, sessionId];

    const newData = updateKid(kidId, { attended: newAttended });
    setData(newData);
    setSelectedKid({ ...selectedKid, kid: { ...selectedKid.kid, attended: newAttended } });
    setSearchResults(prev => prev.map(r =>
      r.kid.id === kidId ? { ...r, kid: { ...r.kid, attended: newAttended } } : r
    ));
  };

  const handleReset = () => {
    setShowResetWarning(true);
  };

  const confirmReset = () => {
    resetData();
    setData(loadData());
    setSearchResults([]);
    setSelectedKid(null);
    setShowResetWarning(false);
  };

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination || !data) return;

    const sourceGroupId = result.source.droppableId;
    const destGroupId = result.destination.droppableId;

    if (sourceGroupId === destGroupId) return;

    const sourceGroup = data.groups[sourceGroupId];
    const destGroup = data.groups[destGroupId];

    const [movedKid] = sourceGroup.kids.splice(result.source.index, 1);
    destGroup.kids.splice(result.destination.index, 0, movedKid);

    const newData = {
      ...data,
      groups: {
        ...data.groups,
        [sourceGroupId]: { ...sourceGroup, kids: [...sourceGroup.kids] },
        [destGroupId]: { ...destGroup, kids: [...destGroup.kids] },
      },
    };

    saveData(newData);
    setData(newData);
  }, [data]);

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center robo-gradient">
      <div className="w-12 h-12 border-4 border-[#00adb3] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // Calculate stats
  const totalKids = Object.values(data.groups).reduce((sum, g) => sum + g.kids.length, 0);
  const checkedIn = Object.values(data.groups).reduce((sum, g) => sum + g.kids.filter(k => k.checkedIn).length, 0);
  const checkedOut = Object.values(data.groups).reduce((sum, g) => sum + g.kids.filter(k => k.checkedOut).length, 0);
  const withAllergies = Object.values(data.groups).reduce((sum, g) => sum + g.kids.filter(k => k.allergies).length, 0);

  return (
    <div className="min-h-screen bg-[#f0f7f7]">
      {/* Header */}
      <header className="robo-gradient shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00adb3] rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg">RC</span>
            </div>
            <div>
              <h1 className="text-xl font-heading text-white">ROBOCODE CAMP</h1>
              <p className="text-white/60 text-sm">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Reset Data
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex gap-2 robo-card p-1.5">
          {(['overview', 'search', 'groups', 'schedule'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-xl transition-all font-semibold capitalize ${
                activeTab === tab
                  ? 'robo-gradient-light text-white shadow-md'
                  : 'text-[#05575c] hover:bg-[#00adb3]/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="robo-card stat-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-[#00adb3]/10 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#00adb3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-heading text-[#003439]">{totalKids}</p>
                <p className="text-sm text-[#05575c]/70">Total Campers</p>
              </div>

              <div className="robo-card stat-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-heading text-[#003439]">{checkedIn}</p>
                <p className="text-sm text-[#05575c]/70">Checked In</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${(checkedIn / totalKids) * 100}%` }}></div>
                </div>
              </div>

              <div className="robo-card stat-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-heading text-[#003439]">{checkedOut}</p>
                <p className="text-sm text-[#05575c]/70">Collected</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(checkedOut / totalKids) * 100}%` }}></div>
                </div>
              </div>

              <div className="robo-card stat-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-heading text-[#003439]">{withAllergies}</p>
                <p className="text-sm text-[#05575c]/70">With Allergies</p>
              </div>
            </div>

            {/* Group Overview */}
            <div className="robo-card p-6">
              <h2 className="text-xl font-heading text-[#003439] mb-4">Group Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(data.groups).map(([groupId, group]) => {
                  const groupCheckedIn = group.kids.filter(k => k.checkedIn).length;
                  return (
                    <div key={groupId} className="p-4 bg-[#f0f7f7] rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-[#003439]">Group {groupId}</h3>
                        <span className="robo-badge">{group.kids.length}</span>
                      </div>
                      <p className="text-xs text-[#05575c]/70 mb-2">Ages {group.ageRange}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white rounded-full h-2">
                          <div
                            className="bg-[#00adb3] h-2 rounded-full transition-all"
                            style={{ width: `${(groupCheckedIn / group.kids.length) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-semibold text-[#003439]">{groupCheckedIn}/{group.kids.length}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setActiveTab('search')}
                className="robo-card p-6 text-left hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 robo-gradient-light rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-heading text-lg text-[#003439]">Search & Check-In</h3>
                    <p className="text-sm text-[#05575c]/70">Find a camper, check in/out, update allergies</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('groups')}
                className="robo-card p-6 text-left hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 robo-gradient-light rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-heading text-lg text-[#003439]">Manage Groups</h3>
                    <p className="text-sm text-[#05575c]/70">Drag & drop kids between groups</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Box */}
            <div className="robo-card p-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a camper by name..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#00adb3] focus:outline-none text-[#003439] placeholder-gray-400"
              />
            </div>

            {/* Selected Kid Details - Now at top */}
            {selectedKid && (
              <div className="robo-card p-6">
                <h2 className="text-lg font-heading text-[#003439] mb-4">Camper Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-2xl font-heading text-[#003439]">{selectedKid.kid.name}</h3>
                    <p className="text-[#05575c]/70">Age {selectedKid.kid.age} | Group {selectedKid.groupId}</p>

                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-[#003439] mb-2">Allergies</label>
                        <input
                          type="text"
                          value={selectedKid.kid.allergies}
                          onChange={(e) => handleAllergyUpdate(selectedKid.kid.id, e.target.value)}
                          placeholder="Enter allergies..."
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#00adb3] focus:outline-none text-[#003439]"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleCheckIn(selectedKid.kid.id)}
                          disabled={selectedKid.kid.checkedIn}
                          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                            selectedKid.kid.checkedIn
                              ? 'bg-green-100 text-green-700 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
                          }`}
                        >
                          {selectedKid.kid.checkedIn ? 'Checked In' : 'Check In'}
                        </button>
                        <button
                          onClick={() => handleCheckOut(selectedKid.kid.id)}
                          disabled={selectedKid.kid.checkedOut}
                          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                            selectedKid.kid.checkedOut
                              ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                              : 'robo-btn'
                          }`}
                        >
                          {selectedKid.kid.checkedOut ? 'Collected' : 'Mark Collected'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-heading text-[#003439] mb-3">Attendance & Schedule</h4>
                    <p className="text-xs text-[#05575c]/60 mb-3">Click to mark attendance</p>
                    <div className="space-y-2">
                      {getGroupSchedule(data, selectedKid.groupId).map((slot, idx) => {
                        const sessionId = `session-${idx + 1}`;
                        const isAttended = (selectedKid.kid.attended || []).includes(sessionId);
                        return (
                          <button
                            key={idx}
                            onClick={() => handleToggleAttendance(selectedKid.kid.id, sessionId)}
                            className={`w-full p-3 rounded-xl border text-left transition-all ${
                              isAttended
                                ? 'bg-green-50 border-green-300 ring-2 ring-green-200'
                                : getAreaTypeBgLight(slot.area.type)
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-[#003439]">{slot.session}</p>
                                <p className="text-sm text-[#05575c]/70">{slot.time} - {slot.area.name}</p>
                              </div>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isAttended ? 'bg-green-500' : 'bg-gray-200'
                              }`}>
                                {isAttended ? (
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      <div className="p-3 rounded-xl border bg-yellow-50 border-yellow-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-[#003439]">Lunch</p>
                            <p className="text-sm text-[#05575c]/70">{data.schedule.lunch.time}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center">
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Attendance Summary */}
                    <div className="mt-4 p-3 bg-[#f0f7f7] rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#003439]">Sessions Attended</span>
                        <span className="robo-badge">
                          {(selectedKid.kid.attended || []).length} / {data.schedule.sessions.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All Students / Search Results List */}
            {(searchQuery.length >= 2 ? searchResults.length > 0 : allKids.length > 0) && (
              <div className="robo-card p-6">
                <h2 className="text-lg font-heading text-[#003439] mb-4">
                  {searchQuery.length >= 2 ? 'Search Results' : 'All Campers'}
                </h2>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {(searchQuery.length >= 2 ? searchResults : allKids).map(({ kid, groupId }) => {
                    const attendedCount = (kid.attended || []).length;
                    const totalSessions = data.schedule.sessions.length;
                    return (
                      <div
                        key={kid.id}
                        onClick={() => setSelectedKid({ kid, groupId })}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          selectedKid?.kid.id === kid.id
                            ? 'border-[#00adb3] bg-[#00adb3]/5'
                            : 'border-gray-200 hover:border-[#00adb3]/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {data.schedule.sessions.map((_, idx) => {
                              const sessionId = `session-${idx + 1}`;
                              const isAttended = (kid.attended || []).includes(sessionId);
                              return (
                                <div
                                  key={idx}
                                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                    isAttended ? 'bg-green-500' : 'bg-gray-200'
                                  }`}
                                >
                                  {isAttended && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div>
                            <p className="font-semibold text-[#003439]">{kid.name}</p>
                            <p className="text-xs text-[#05575c]/60">
                              Group {groupId} | Age {kid.age}
                              {kid.allergies && <span className="text-red-500 ml-1">| {kid.allergies}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#05575c]/60">{attendedCount}/{totalSessions}</span>
                          {kid.checkedIn && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                          {kid.checkedOut && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-4">
            <div className="robo-card p-4">
              <p className="text-sm text-[#05575c]/70">
                <span className="font-semibold text-[#003439]">Tip:</span> Drag and drop campers between groups to reassign them.
              </p>
            </div>
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(data.groups).map(([groupId, group]) => (
                  <Droppable droppableId={groupId} key={groupId}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`robo-card p-4 drop-zone ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-heading text-lg text-[#003439]">Group {groupId}</h3>
                            <p className="text-xs text-[#05575c]/70">Ages {group.ageRange}</p>
                          </div>
                          <span className="robo-badge">{group.kids.length}</span>
                        </div>
                        <div className="space-y-2 min-h-[200px] max-h-[400px] overflow-y-auto">
                          {group.kids.map((kid, index) => (
                            <Draggable key={kid.id} draggableId={kid.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-3 bg-[#f0f7f7] rounded-xl text-sm cursor-grab active:cursor-grabbing drag-item ${
                                    snapshot.isDragging ? 'dragging' : ''
                                  }`}
                                  onClick={() => {
                                    setSelectedKid({ kid, groupId });
                                    setActiveTab('search');
                                  }}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="font-semibold text-[#003439]">{kid.name}</span>
                                      <p className="text-xs text-[#05575c]/60">Age {kid.age}</p>
                                    </div>
                                    <div className="flex gap-1">
                                      {kid.checkedIn && <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>}
                                      {kid.allergies && <span className="w-2.5 h-2.5 rounded-full bg-red-500" title={kid.allergies}></span>}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                        <div className="mt-3 pt-3 border-t border-[#00adb3]/20 text-xs text-[#05575c]/70 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          {group.kids.filter(k => k.checkedIn).length} checked in
                          {group.kids.some(k => k.allergies) && (
                            <>
                              <span className="mx-1">|</span>
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              {group.kids.filter(k => k.allergies).length} allergies
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          </div>
        )}

        {activeTab === 'schedule' && (
          <>
            <div className="robo-card p-6 overflow-x-auto">
              <h2 className="text-xl font-heading text-[#003439] mb-2">Rotation Schedule</h2>
              <p className="text-sm text-[#05575c]/60 mb-4">Click on a group to view students and attendance</p>
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-[#00adb3]/20">
                    <th className="text-left py-3 px-4 text-[#05575c] font-semibold">Group</th>
                    {data.schedule.sessions.map(session => (
                      <th key={session.id} className="text-left py-3 px-4 text-[#05575c] font-semibold">
                        <div>{session.name}</div>
                        <div className="text-xs font-normal text-[#05575c]/60">{session.time}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.schedule.rotation).map(([groupId, rotation]) => (
                    <tr key={groupId} className="border-b border-[#00adb3]/10 hover:bg-[#00adb3]/5 transition-colors">
                      <td
                        className="py-4 px-4 font-semibold text-[#003439] cursor-pointer hover:text-[#00adb3]"
                        onClick={() => setScheduleModal({ groupId, sessionIndex: -1 })}
                      >
                        Group {groupId}
                      </td>
                      {rotation.map((areaId, idx) => {
                        const area = data.schedule.areas.find(a => a.id === areaId);
                        return (
                          <td key={idx} className="py-4 px-4">
                            <button
                              onClick={() => setScheduleModal({ groupId, sessionIndex: idx })}
                              className={`px-4 py-2 rounded-xl text-sm font-semibold inline-block cursor-pointer hover:ring-2 hover:ring-[#00adb3] transition-all ${getAreaTypeBgLight(area?.type || '')}`}
                            >
                              {area?.name}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
                <span className="font-semibold text-[#003439]">Legend:</span>
                <span className="px-4 py-2 rounded-xl bg-blue-100 border border-blue-300 font-semibold text-blue-800">Robotics</span>
                <span className="px-4 py-2 rounded-xl bg-green-100 border border-green-300 font-semibold text-green-800">Game Dev</span>
                <span className="px-4 py-2 rounded-xl bg-purple-100 border border-purple-300 font-semibold text-purple-800">3D Printing</span>
                <span className="px-4 py-2 rounded-xl bg-orange-100 border border-orange-300 font-semibold text-orange-800">Game Area</span>
              </div>
            </div>

            {/* Schedule Modal */}
            {scheduleModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setScheduleModal(null)}>
                <div className="robo-card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-heading text-[#003439]">
                        Group {scheduleModal.groupId}
                      </h2>
                      <p className="text-sm text-[#05575c]/60">
                        {scheduleModal.sessionIndex >= 0
                          ? `${data.schedule.sessions[scheduleModal.sessionIndex].name} - ${data.schedule.sessions[scheduleModal.sessionIndex].time}`
                          : `${data.groups[scheduleModal.groupId].kids.length} campers`
                        }
                      </p>
                    </div>
                    <button
                      onClick={() => setScheduleModal(null)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {data.groups[scheduleModal.groupId].kids.map(kid => {
                      const sessionId = `session-${scheduleModal.sessionIndex + 1}`;
                      const isAttended = scheduleModal.sessionIndex >= 0
                        ? (kid.attended || []).includes(sessionId)
                        : (kid.attended || []).length > 0;
                      const attendedCount = (kid.attended || []).length;

                      return (
                        <button
                          key={kid.id}
                          onClick={() => {
                            setSelectedKid({ kid, groupId: scheduleModal.groupId });
                            setScheduleModal(null);
                            setActiveTab('search');
                          }}
                          className={`w-full p-3 rounded-xl flex items-center justify-between cursor-pointer hover:ring-2 hover:ring-[#00adb3] transition-all ${
                            isAttended ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <div className="text-left">
                            <p className="font-semibold text-[#003439]">{kid.name}</p>
                            <p className="text-xs text-[#05575c]/60">
                              Age {kid.age}
                              {kid.allergies && <span className="text-red-500 ml-2">| {kid.allergies}</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {scheduleModal.sessionIndex < 0 && (
                              <span className="text-xs text-[#05575c]/60">{attendedCount}/4</span>
                            )}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isAttended ? 'bg-green-500' : 'bg-gray-300'
                            }`}>
                              {isAttended ? (
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-sm text-[#05575c]/70">
                      {scheduleModal.sessionIndex >= 0
                        ? `${data.groups[scheduleModal.groupId].kids.filter(k => (k.attended || []).includes(`session-${scheduleModal.sessionIndex + 1}`)).length} / ${data.groups[scheduleModal.groupId].kids.length} attended`
                        : `${data.groups[scheduleModal.groupId].kids.filter(k => (k.attended || []).length > 0).length} / ${data.groups[scheduleModal.groupId].kids.length} have attendance`
                      }
                    </span>
                    <button
                      onClick={() => setScheduleModal(null)}
                      className="robo-btn px-4 py-2 rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Reset Warning Modal */}
      {showResetWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowResetWarning(false)}>
          <div className="robo-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-heading text-[#003439]">Reset All Data?</h2>
                <p className="text-sm text-[#05575c]/70">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-700">
                <strong>Warning:</strong> This will reset all camper data including:
              </p>
              <ul className="text-sm text-red-600 mt-2 ml-4 list-disc space-y-1">
                <li>Check-in / check-out status</li>
                <li>Attendance records</li>
                <li>Group assignments</li>
                <li>Allergy notes</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetWarning(false)}
                className="flex-1 py-3 px-4 rounded-xl font-semibold border-2 border-gray-200 text-[#003439] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="flex-1 py-3 px-4 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md"
              >
                Yes, Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
