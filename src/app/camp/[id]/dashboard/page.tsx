'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Kid {
  id: string;
  name: string;
  age: number;
  allergies: string;
  checkedIn: boolean;
  checkedOut: boolean;
  attended: string[];
}

interface Group {
  ageRange: string;
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
    case 'robotics': return 'bg-blue-100 border-blue-300';
    case 'gamedev': return 'bg-green-100 border-green-300';
    case '3dprinting': return 'bg-purple-100 border-purple-300';
    case 'game': return 'bg-orange-100 border-orange-300';
    default: return 'bg-gray-100 border-gray-300';
  }
}

export default function CampDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: campId } = use(params);
  const [data, setData] = useState<CampData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKid, setSelectedKid] = useState<{ kid: Kid; groupId: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'search' | 'groups' | 'schedule'>('overview');
  const [scheduleModal, setScheduleModal] = useState<{ groupId: string; sessionIndex: number } | null>(null);
  const [groupModal, setGroupModal] = useState<string | null>(null);
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [showAddKid, setShowAddKid] = useState(false);
  const [newKid, setNewKid] = useState({ name: '', parentName: '', age: '', allergies: '' });
  const [addKidMessage, setAddKidMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [removeCheckInConfirm, setRemoveCheckInConfirm] = useState<{ kidId: string; kidName: string } | null>(null);
  const [removeCollectedConfirm, setRemoveCollectedConfirm] = useState<{ kidId: string; kidName: string } | null>(null);
  const [checkInFilter, setCheckInFilter] = useState<'all' | 'checked-in' | 'not-checked-in'>('all');
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
    const { role } = JSON.parse(auth);
    if (role !== 'admin') {
      router.push(`/camp/${campId}/teacher`);
      return;
    }
    loadData();
  }, [campId, router, loadData]);

  const handleLogout = () => {
    localStorage.removeItem(`camp_${campId}_auth`);
    router.push(`/camp/${campId}`);
  };

  const handleCheckIn = async (kidId: string) => {
    await fetch(`/api/camps/${campId}/kids/${kidId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkedIn: true }),
    });
    loadData();
  };

  const handleCheckOut = async (kidId: string) => {
    await fetch(`/api/camps/${campId}/kids/${kidId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkedOut: true }),
    });
    loadData();
  };

  const handleRemoveCheckIn = async (kidId: string) => {
    await fetch(`/api/camps/${campId}/kids/${kidId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkedIn: false }),
    });
    setRemoveCheckInConfirm(null);
    setSelectedKid(null);
    loadData();
  };

  const handleRemoveCollected = async (kidId: string) => {
    await fetch(`/api/camps/${campId}/kids/${kidId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkedOut: false }),
    });
    setRemoveCollectedConfirm(null);
    setSelectedKid(null);
    loadData();
  };

  const handleAllergyUpdate = async (kidId: string, allergies: string) => {
    await fetch(`/api/camps/${campId}/kids/${kidId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allergies }),
    });
    loadData();
  };

  const handleToggleAttendance = async (kidId: string, sessionId: string) => {
    const sessionOrder = parseInt(sessionId.replace('session-', ''));
    const kid = selectedKid?.kid;
    const isAttended = kid?.attended.includes(sessionId);

    await fetch(`/api/camps/${campId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kidId, sessionOrder, attended: !isAttended }),
    });
    loadData();
  };

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination || !data) return;

    const sourceGroupId = result.source.droppableId;
    const destGroupId = result.destination.droppableId;

    if (sourceGroupId === destGroupId) return;

    const kidId = result.draggableId;

    await fetch(`/api/camps/${campId}/kids/${kidId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newGroupName: destGroupId }),
    });
    loadData();
  }, [data, campId, loadData]);

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center robo-gradient">
      <div className="w-12 h-12 border-4 border-[#00adb3] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // Computed values
  const allKids = Object.entries(data.groups).flatMap(([groupId, group]) =>
    group.kids.map(kid => ({ kid, groupId }))
  );
  const totalKids = allKids.length;
  const checkedIn = allKids.filter(k => k.kid.checkedIn).length;
  const checkedOut = allKids.filter(k => k.kid.checkedOut).length;
  const withAllergies = allKids.filter(k => k.kid.allergies).length;

  const filteredByCheckIn = checkInFilter === 'all'
    ? allKids
    : checkInFilter === 'checked-in'
      ? allKids.filter(({ kid }) => kid.checkedIn)
      : allKids.filter(({ kid }) => !kid.checkedIn);

  const searchResults = searchQuery.length >= 2
    ? filteredByCheckIn.filter(({ kid }) => kid.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : checkInFilter !== 'all' ? filteredByCheckIn : [];

  const getGroupSchedule = (groupId: string) => {
    const rotation = data.schedule.rotation[groupId] || [];
    return rotation.map((areaId, idx) => ({
      session: data.schedule.sessions[idx]?.name || '',
      time: data.schedule.sessions[idx]?.time || '',
      area: data.schedule.areas.find(a => a.id === areaId) || { id: '', name: '', type: '' },
    }));
  };

  const handleAddKid = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddKidMessage(null);

    if (!newKid.name || !newKid.age) {
      setAddKidMessage({ type: 'error', text: 'Name and age are required' });
      return;
    }

    const res = await fetch(`/api/camps/${campId}/kids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newKid),
    });

    const result = await res.json();
    if (result.success) {
      setAddKidMessage({ type: 'success', text: result.message });
      setNewKid({ name: '', parentName: '', age: '', allergies: '' });
      loadData(); // Refresh data
      setTimeout(() => setAddKidMessage(null), 3000);
    } else {
      setAddKidMessage({ type: 'error', text: result.error || 'Failed to add kid' });
    }
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
              <p className="text-white/60 text-sm">Admin Dashboard</p>
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
              <div className="robo-card p-6">
                <p className="text-3xl font-heading text-[#003439]">{totalKids}</p>
                <p className="text-sm text-[#05575c]/70">Total Campers</p>
              </div>
              <div className="robo-card p-6">
                <p className="text-3xl font-heading text-[#003439]">{checkedIn}</p>
                <p className="text-sm text-[#05575c]/70">Checked In</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(checkedIn / totalKids) * 100}%` }}></div>
                </div>
              </div>
              <div className="robo-card p-6">
                <p className="text-3xl font-heading text-[#003439]">{checkedOut}</p>
                <p className="text-sm text-[#05575c]/70">Collected</p>
              </div>
              <div className="robo-card p-6">
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
                    <button
                      key={groupId}
                      onClick={() => setGroupModal(groupId)}
                      className="p-4 bg-[#f0f7f7] rounded-xl text-left hover:shadow-md hover:bg-[#00adb3]/10 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-[#003439]">Group {groupId}</h3>
                        <span className="robo-badge">{group.kids.length}</span>
                      </div>
                      <p className="text-xs text-[#05575c]/70 mb-2">Ages {group.ageRange}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white rounded-full h-2">
                          <div className="bg-[#00adb3] h-2 rounded-full" style={{ width: `${(groupCheckedIn / group.kids.length) * 100}%` }}></div>
                        </div>
                        <span className="text-xs font-semibold text-[#003439]">{groupCheckedIn}/{group.kids.length}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="robo-card p-6">
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a camper by name..."
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#00adb3] focus:outline-none text-[#003439]"
                />
                <button
                  onClick={() => setShowAddKid(!showAddKid)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    showAddKid
                      ? 'bg-gray-200 text-gray-600'
                      : 'robo-btn'
                  }`}
                >
                  {showAddKid ? 'Cancel' : '+ Add Kid'}
                </button>
              </div>

              {/* Filter buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setCheckInFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    checkInFilter === 'all'
                      ? 'bg-[#003439] text-white'
                      : 'bg-gray-100 text-[#05575c] hover:bg-gray-200'
                  }`}
                >
                  All ({allKids.length})
                </button>
                <button
                  onClick={() => setCheckInFilter('checked-in')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    checkInFilter === 'checked-in'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  Checked In ({allKids.filter(k => k.kid.checkedIn).length})
                </button>
                <button
                  onClick={() => setCheckInFilter('not-checked-in')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    checkInFilter === 'not-checked-in'
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                  }`}
                >
                  Not Checked In ({allKids.filter(k => !k.kid.checkedIn).length})
                </button>
              </div>

              {/* Add Kid Form */}
              {showAddKid && (
                <form onSubmit={handleAddKid} className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="font-semibold text-[#003439] mb-4">Add New Camper</h3>
                  {addKidMessage && (
                    <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${
                      addKidMessage.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-600'
                    }`}>
                      {addKidMessage.text}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#003439] mb-1">Child Name *</label>
                      <input
                        type="text"
                        value={newKid.name}
                        onChange={(e) => setNewKid({ ...newKid, name: e.target.value })}
                        placeholder="Enter child's name"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#00adb3] focus:outline-none text-[#003439]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#003439] mb-1">Parent Name</label>
                      <input
                        type="text"
                        value={newKid.parentName}
                        onChange={(e) => setNewKid({ ...newKid, parentName: e.target.value })}
                        placeholder="Enter parent's name"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#00adb3] focus:outline-none text-[#003439]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#003439] mb-1">Age *</label>
                      <input
                        type="number"
                        min="4"
                        max="16"
                        value={newKid.age}
                        onChange={(e) => setNewKid({ ...newKid, age: e.target.value })}
                        placeholder="Enter age"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#00adb3] focus:outline-none text-[#003439]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#003439] mb-1">Allergies</label>
                      <input
                        type="text"
                        value={newKid.allergies}
                        onChange={(e) => setNewKid({ ...newKid, allergies: e.target.value })}
                        placeholder="Enter any allergies"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#00adb3] focus:outline-none text-[#003439]"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      className="robo-btn px-6 py-2 rounded-xl font-semibold"
                    >
                      Add Camper (Auto-assign Group)
                    </button>
                  </div>
                  <p className="text-xs text-[#05575c]/60 mt-2">
                    The camper will be automatically assigned to the best group based on age and group sizes.
                  </p>
                </form>
              )}
            </div>

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
                          className={`flex-1 py-3 px-4 rounded-xl font-semibold ${
                            selectedKid.kid.checkedIn
                              ? 'bg-green-100 text-green-700 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {selectedKid.kid.checkedIn ? 'Checked In' : 'Check In'}
                        </button>
                        <button
                          onClick={() => handleCheckOut(selectedKid.kid.id)}
                          disabled={selectedKid.kid.checkedOut}
                          className={`flex-1 py-3 px-4 rounded-xl font-semibold ${
                            selectedKid.kid.checkedOut
                              ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                              : 'robo-btn'
                          }`}
                        >
                          {selectedKid.kid.checkedOut ? 'Collected' : 'Mark Collected'}
                        </button>
                      </div>
                      {selectedKid.kid.checkedIn && (
                        <button
                          onClick={() => setRemoveCheckInConfirm({ kidId: selectedKid.kid.id, kidName: selectedKid.kid.name })}
                          className="w-full py-2 px-4 rounded-xl font-semibold text-red-600 border-2 border-red-200 hover:bg-red-50 transition-colors"
                        >
                          Remove Check-In
                        </button>
                      )}
                      {selectedKid.kid.checkedOut && (
                        <button
                          onClick={() => setRemoveCollectedConfirm({ kidId: selectedKid.kid.id, kidName: selectedKid.kid.name })}
                          className="w-full py-2 px-4 rounded-xl font-semibold text-orange-600 border-2 border-orange-200 hover:bg-orange-50 transition-colors"
                        >
                          Undo Collected
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-heading text-[#003439] mb-3">Attendance</h4>
                    <div className="space-y-2">
                      {getGroupSchedule(selectedKid.groupId).map((slot, idx) => {
                        const sessionId = `session-${idx + 1}`;
                        const isAttended = selectedKid.kid.attended.includes(sessionId);
                        return (
                          <button
                            key={idx}
                            onClick={() => handleToggleAttendance(selectedKid.kid.id, sessionId)}
                            className={`w-full p-3 rounded-xl border text-left transition-all ${
                              isAttended ? 'bg-green-50 border-green-300' : getAreaTypeBgLight(slot.area.type)
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
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(searchQuery.length >= 2 ? searchResults.length > 0 : filteredByCheckIn.length > 0) && (
              <div className="robo-card p-6">
                <h2 className="text-lg font-heading text-[#003439] mb-4">
                  {searchQuery.length >= 2 ? 'Search Results' : checkInFilter === 'checked-in' ? 'Checked In Campers' : checkInFilter === 'not-checked-in' ? 'Not Checked In Campers' : 'All Campers'}
                </h2>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {(searchQuery.length >= 2 ? searchResults : filteredByCheckIn).map(({ kid, groupId }) => (
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
                            const isAttended = kid.attended.includes(sessionId);
                            return (
                              <div key={idx} className={`w-4 h-4 rounded-full ${isAttended ? 'bg-green-500' : 'bg-gray-200'}`}></div>
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
                        {kid.checkedIn && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                        {kid.checkedOut && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-4">
            <div className="robo-card p-4">
              <p className="text-sm text-[#05575c]/70">
                <span className="font-semibold text-[#003439]">Tip:</span> Drag and drop campers between groups.
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
                        className={`robo-card p-4 ${snapshot.isDraggingOver ? 'ring-2 ring-[#00adb3]' : ''}`}
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
                                  className={`p-3 bg-[#f0f7f7] rounded-xl text-sm cursor-grab ${
                                    snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="font-semibold text-[#003439]">{kid.name}</span>
                                      <p className="text-xs text-[#05575c]/60">Age {kid.age}</p>
                                    </div>
                                    <div className="flex gap-1">
                                      {kid.checkedIn && <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>}
                                      {kid.allergies && <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
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
          <div className="robo-card p-6 overflow-x-auto">
            <h2 className="text-xl font-heading text-[#003439] mb-4">Rotation Schedule</h2>
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
                  <tr key={groupId} className="border-b border-[#00adb3]/10 hover:bg-[#00adb3]/5">
                    <td className="py-4 px-4 font-semibold text-[#003439]">Group {groupId}</td>
                    {rotation.map((areaId, idx) => {
                      const area = data.schedule.areas.find(a => a.id === areaId);
                      return (
                        <td key={idx} className="py-4 px-4">
                          <span className={`px-4 py-2 rounded-xl text-sm font-semibold inline-block ${getAreaTypeBgLight(area?.type || '')}`}>
                            {area?.name}
                          </span>
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
        )}
      </main>

      {/* Group Modal */}
      {groupModal && data.groups[groupModal] && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setGroupModal(null)}>
          <div className="robo-card p-6 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-heading text-[#003439]">Group {groupModal}</h2>
                <p className="text-sm text-[#05575c]/70">Ages {data.groups[groupModal].ageRange} | {data.groups[groupModal].kids.length} campers</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="robo-badge">
                  {data.groups[groupModal].kids.filter(k => k.checkedIn).length}/{data.groups[groupModal].kids.length} in
                </span>
                <button onClick={() => setGroupModal(null)} className="text-[#05575c] hover:text-[#003439]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex gap-2 mb-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Checked In</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Collected</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Allergies</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {data.groups[groupModal].kids.map(kid => (
                <button
                  key={kid.id}
                  onClick={() => {
                    setSelectedKid({ kid, groupId: groupModal });
                    setGroupModal(null);
                    setActiveTab('search');
                  }}
                  className="w-full p-3 bg-[#f0f7f7] rounded-xl text-left hover:bg-[#00adb3]/10 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-[#003439]">{kid.name}</p>
                    <p className="text-xs text-[#05575c]/60">Age {kid.age}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {kid.allergies && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{kid.allergies}</span>
                    )}
                    <div className="flex gap-1">
                      {kid.checkedIn && <span className="w-3 h-3 rounded-full bg-green-500"></span>}
                      {kid.checkedOut && <span className="w-3 h-3 rounded-full bg-blue-500"></span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setGroupModal(null)}
                className="w-full robo-btn py-3 rounded-xl font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Check-In Confirmation Modal */}
      {removeCheckInConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setRemoveCheckInConfirm(null)}>
          <div className="robo-card p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-heading text-[#003439] mb-2">Remove Check-In?</h2>
            <p className="text-[#05575c]/70 mb-6">
              Are you sure you want to remove the check-in for <strong>{removeCheckInConfirm.kidName}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRemoveCheckInConfirm(null)}
                className="flex-1 py-3 px-4 rounded-xl font-semibold border-2 border-gray-200 text-[#05575c] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveCheckIn(removeCheckInConfirm.kidId)}
                className="flex-1 py-3 px-4 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Collected Confirmation Modal */}
      {removeCollectedConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setRemoveCollectedConfirm(null)}>
          <div className="robo-card p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-heading text-[#003439] mb-2">Undo Collected?</h2>
            <p className="text-[#05575c]/70 mb-6">
              Are you sure you want to undo the collected status for <strong>{removeCollectedConfirm.kidName}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRemoveCollectedConfirm(null)}
                className="flex-1 py-3 px-4 rounded-xl font-semibold border-2 border-gray-200 text-[#05575c] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveCollected(removeCollectedConfirm.kidId)}
                className="flex-1 py-3 px-4 rounded-xl font-semibold bg-orange-600 text-white hover:bg-orange-700"
              >
                Undo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
