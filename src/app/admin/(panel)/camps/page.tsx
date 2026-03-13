'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Calendar, MapPin, X } from 'lucide-react';

interface CampDay {
  id: string;
  date: string;
  dayLabel: string;
  weekNumber: number;
}

interface Camp {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  adminPassword: string;
  teacherPassword: string;
  lunchTime: string;
  location: { id: string; name: string } | null;
  season: { id: string; title: string } | null;
  campDays: CampDay[];
  _count: { bookings: number; groups: number };
}

interface SelectOption { id: string; name?: string; title?: string }
interface DateRange { from: string; to: string }

function rangesToDays(ranges: DateRange[]): { date: string; dayLabel: string; weekNumber: number }[] {
  const allDates: string[] = [];
  for (const range of ranges) {
    if (!range.from || !range.to) continue;
    const start = new Date(range.from);
    const end = new Date(range.to);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day >= 1 && day <= 5) {
        allDates.push(d.toISOString().slice(0, 10));
      }
    }
  }
  const unique = [...new Set(allDates)].sort();
  return unique.map((dateStr, idx) => {
    const d = new Date(dateStr);
    return {
      date: dateStr,
      dayLabel: d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
      weekNumber: idx < 5 ? 1 : Math.ceil((idx + 1) / 5),
    };
  });
}

function daysToRanges(campDays: CampDay[]): DateRange[] {
  if (campDays.length === 0) return [{ from: '', to: '' }];
  const dates = campDays.map((d) => d.date.slice(0, 10)).sort();
  const ranges: DateRange[] = [];
  let rangeStart = dates[0];
  let prev = dates[0];
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(prev);
    const currDate = new Date(dates[i]);
    const diffDays = (currDate.getTime() - prevDate.getTime()) / 86400000;
    if (diffDays > 3) {
      ranges.push({ from: rangeStart, to: prev });
      rangeStart = dates[i];
    }
    prev = dates[i];
  }
  ranges.push({ from: rangeStart, to: prev });
  return ranges;
}

const EMPTY_FORM = {
  name: '', description: '', startDate: '', endDate: '',
  adminPassword: 'admin2026', teacherPassword: 'teacher2026',
  lunchTime: '12:00-12:30', locationId: '', seasonId: '',
};

export default function CampsPage() {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [locations, setLocations] = useState<SelectOption[]>([]);
  const [seasons, setSeasons] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Camp | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [dateRanges, setDateRanges] = useState<DateRange[]>([{ from: '', to: '' }]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [campsRes, locsRes, seasonsRes] = await Promise.all([
      fetch('/api/admin/camps').then((r) => r.json()),
      fetch('/api/admin/locations').then((r) => r.json()),
      fetch('/api/admin/seasons').then((r) => r.json()),
    ]);
    setCamps(campsRes);
    setLocations(locsRes);
    setSeasons(seasonsRes);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDateRanges([{ from: '', to: '' }]);
    setShowModal(true);
  };

  const openEdit = (camp: Camp) => {
    setEditing(camp);
    setForm({
      name: camp.name,
      description: camp.description || '',
      startDate: camp.startDate.slice(0, 10),
      endDate: camp.endDate.slice(0, 10),
      adminPassword: camp.adminPassword,
      teacherPassword: camp.teacherPassword,
      lunchTime: camp.lunchTime,
      locationId: camp.location?.id || '',
      seasonId: camp.season?.id || '',
    });
    setDateRanges(daysToRanges(camp.campDays));
    setShowModal(true);
  };

  const updateRange = (idx: number, key: 'from' | 'to', value: string) => {
    setDateRanges((prev) => prev.map((r, i) => i === idx ? { ...r, [key]: value } : r));
  };

  const addRange = () => setDateRanges((prev) => [...prev, { from: '', to: '' }]);

  const removeRange = (idx: number) => {
    setDateRanges((prev) => prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx));
  };

  const generatedDays = rangesToDays(dateRanges);

  const handleSave = async () => {
    setSaving(true);
    const url = editing ? `/api/admin/camps/${editing.id}` : '/api/admin/camps';
    const method = editing ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description || null,
        startDate: form.startDate,
        endDate: form.endDate,
        adminPassword: form.adminPassword,
        teacherPassword: form.teacherPassword,
        lunchTime: form.lunchTime,
        locationId: form.locationId || null,
        seasonId: form.seasonId || null,
        days: generatedDays,
      }),
    });
    setSaving(false);
    setShowModal(false);
    load();
  };

  const handleDelete = async (camp: Camp) => {
    if (!confirm(`Delete "${camp.name}"?`)) return;
    const res = await fetch(`/api/admin/camps/${camp.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Delete failed');
      return;
    }
    load();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  const updateForm = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#003439] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#003439]">Camps</h1>
          <p className="text-sm text-[#05575c]/60 mt-1">Manage individual camps with dates, locations and settings</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] transition-colors">
          <Plus size={16} /> New Camp
        </button>
      </div>

      {camps.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <p className="text-[#05575c]/50">No camps yet. Create a season and location first, then add camps.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {camps.map((camp) => (
            <div key={camp.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-[#003439]">{camp.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {camp.season && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{camp.season.title}</span>
                    )}
                    {camp.location && (
                      <span className="text-xs text-[#05575c]/50 flex items-center gap-1"><MapPin size={12} /> {camp.location.name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(camp)} className="p-2 rounded-lg hover:bg-gray-50 text-[#05575c]/40 hover:text-[#003439]"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(camp)} className="p-2 rounded-lg hover:bg-red-50 text-[#05575c]/40 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-[#05575c]/50 mt-2">
                <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(camp.startDate)} &ndash; {formatDate(camp.endDate)}</span>
                <span>{camp.campDays.length} days</span>
                <span>{camp._count.bookings} bookings</span>
                <span>{camp._count.groups} groups</span>
              </div>

              {camp.campDays.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {camp.campDays.map((d) => (
                    <span key={d.id} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-[#05575c]/60">
                      {new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#003439] mb-4">{editing ? 'Edit Camp' : 'New Camp'}</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#003439] mb-1">Camp Name</label>
                <input type="text" value={form.name} onChange={(e) => updateForm('name', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" placeholder="e.g. Easter 2026 - Solihull" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#003439] mb-1">Description (optional)</label>
                <input type="text" value={form.description} onChange={(e) => updateForm('description', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#003439] mb-1">Season</label>
                  <select value={form.seasonId} onChange={(e) => updateForm('seasonId', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20">
                    <option value="">No season</option>
                    {seasons.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#003439] mb-1">Location</label>
                  <select value={form.locationId} onChange={(e) => updateForm('locationId', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20">
                    <option value="">No location</option>
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#003439] mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => updateForm('startDate', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#003439] mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => updateForm('endDate', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#003439] mb-1.5">Camp Day Ranges</label>
                <p className="text-[10px] text-[#05575c]/40 mb-2">Add date ranges for the camp. Weekdays (Mon-Fri) within each range are included automatically.</p>
                <div className="space-y-2">
                  {dateRanges.map((range, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={range.from}
                          onChange={(e) => updateRange(idx, 'from', e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20"
                        />
                        <input
                          type="date"
                          value={range.to}
                          onChange={(e) => updateRange(idx, 'to', e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20"
                        />
                      </div>
                      {dateRanges.length > 1 && (
                        <button type="button" onClick={() => removeRange(idx)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#05575c]/30 hover:text-red-500 transition-colors">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addRange} className="mt-2 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-[#05575c]/50 hover:border-[#003439] hover:text-[#003439] transition-colors">
                  <Plus size={14} /> Add another range
                </button>
                {generatedDays.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-gray-50">
                    <p className="text-[10px] font-semibold text-[#003439] mb-1.5">{generatedDays.length} day(s) selected:</p>
                    <div className="flex flex-wrap gap-1">
                      {generatedDays.map((d) => (
                        <span key={d.date} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[#05575c]/70">
                          {new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#003439] mb-1">Lunch Time</label>
                <input type="text" value={form.lunchTime} onChange={(e) => updateForm('lunchTime', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" placeholder="12:00-12:30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#003439] mb-1">Admin Password</label>
                  <input type="text" value={form.adminPassword} onChange={(e) => updateForm('adminPassword', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#003439] mb-1">Teacher Password</label>
                  <input type="text" value={form.teacherPassword} onChange={(e) => updateForm('teacherPassword', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm text-[#05575c]/60 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.startDate || !form.endDate} className="px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] disabled:opacity-40">
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
