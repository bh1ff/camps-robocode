'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Save, ChevronDown, ChevronUp, PoundSterling, MapPin, X, Calendar } from 'lucide-react';

interface CampDayData { id: string; date: string; dayLabel: string; weekNumber: number }
interface DateRange { from: string; to: string }

interface CampInSeason {
  id: string;
  name: string;
  active: boolean;
  allowsHaf: boolean;
  allowsPaid: boolean;
  location: { id: string; name: string } | null;
  campDays: CampDayData[];
  _count: { bookings: number };
}

function rangesToDays(ranges: DateRange[]): { date: string; dayLabel: string; weekNumber: number }[] {
  const allDates: string[] = [];
  for (const range of ranges) {
    if (!range.from || !range.to) continue;
    const start = new Date(range.from);
    const end = new Date(range.to);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day >= 1 && day <= 5) allDates.push(d.toISOString().slice(0, 10));
    }
  }
  const unique = [...new Set(allDates)].sort();
  return unique.map((dateStr, idx) => {
    const d = new Date(dateStr);
    return { date: dateStr, dayLabel: d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }), weekNumber: idx < 5 ? 1 : Math.ceil((idx + 1) / 5) };
  });
}

function daysToRanges(campDays: CampDayData[]): DateRange[] {
  if (campDays.length === 0) return [{ from: '', to: '' }];
  const dates = campDays.map((d) => d.date.slice(0, 10)).sort();
  const ranges: DateRange[] = [];
  let rangeStart = dates[0];
  let prev = dates[0];
  for (let i = 1; i < dates.length; i++) {
    const diffDays = (new Date(dates[i]).getTime() - new Date(prev).getTime()) / 86400000;
    if (diffDays > 3) { ranges.push({ from: rangeStart, to: prev }); rangeStart = dates[i]; }
    prev = dates[i];
  }
  ranges.push({ from: rangeStart, to: prev });
  return ranges;
}

interface Season {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  endDate: string;
  active: boolean;
  camps: CampInSeason[];
  priceTiers: { id: string; days: number; pricePence: number }[];
}

interface LocationOption {
  id: string;
  name: string;
  slug: string;
  region: string;
  allowsPaid: boolean;
}

interface EditTier {
  days: string;
  pricePence: string;
}

type TabFilter = 'active' | 'inactive' | 'all';

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [allLocations, setAllLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Season | null>(null);
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', active: true });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<TabFilter>('active');

  const [expandedPricing, setExpandedPricing] = useState<string | null>(null);
  const [editTiers, setEditTiers] = useState<EditTier[]>([]);
  const [savingPricing, setSavingPricing] = useState(false);

  const [addingLocationFor, setAddingLocationFor] = useState<string | null>(null);

  const [editingDates, setEditingDates] = useState<CampInSeason | null>(null);
  const [dateRanges, setDateRanges] = useState<DateRange[]>([{ from: '', to: '' }]);
  const [savingDates, setSavingDates] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      fetch('/api/admin/seasons').then((r) => r.json()),
      fetch('/api/admin/locations').then((r) => r.json()),
    ]).then(([seasonData, locData]) => {
      setSeasons(seasonData);
      setAllLocations(
        (Array.isArray(locData) ? locData : []).map((l: LocationOption & Record<string, unknown>) => ({
          id: l.id, name: l.name, slug: l.slug, region: l.region, allowsPaid: l.allowsPaid,
        }))
      );
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredSeasons = seasons.filter((s) => {
    if (tab === 'active') return s.active;
    if (tab === 'inactive') return !s.active;
    return true;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', startDate: '', endDate: '', active: true });
    setShowModal(true);
  };

  const openEdit = (season: Season) => {
    setEditing(season);
    setForm({
      title: season.title,
      startDate: season.startDate.slice(0, 10),
      endDate: season.endDate.slice(0, 10),
      active: season.active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const url = editing ? `/api/admin/seasons/${editing.id}` : '/api/admin/seasons';
    const method = editing ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    setShowModal(false);
    load();
  };

  const toggleActive = async (season: Season) => {
    const newActive = !season.active;
    if (newActive && !confirm(`Set "${season.title}" as the active season? This will deactivate all other seasons.`)) return;
    await fetch(`/api/admin/seasons/${season.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: newActive }),
    });
    load();
  };

  const handleDelete = async (season: Season) => {
    if (!confirm(`Delete "${season.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/seasons/${season.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Delete failed');
      return;
    }
    load();
  };

  const updateCamp = async (campId: string, updates: Record<string, unknown>) => {
    await fetch(`/api/admin/camps/${campId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    load();
  };

  const addLocationToSeason = async (season: Season, locationId: string) => {
    const loc = allLocations.find((l) => l.id === locationId);
    if (!loc) return;
    setAddingLocationFor(null);

    const regionLabel = loc.region.charAt(0).toUpperCase() + loc.region.slice(1);
    const campName = `${season.title} - ${regionLabel} (${loc.name})`;

    const start = new Date(season.startDate);
    const end = new Date(season.endDate);
    const days: { date: string; dayLabel: string; weekNumber: number }[] = [];
    let weekNum = 1;
    let prevWeek = -1;
    const d = new Date(start);
    while (d <= end) {
      const dow = d.getDay();
      const isoWeek = getISOWeek(d);
      if (prevWeek !== -1 && isoWeek !== prevWeek) weekNum++;
      prevWeek = isoWeek;
      if (dow >= 1 && dow <= 4) {
        days.push({
          date: d.toISOString().slice(0, 10),
          dayLabel: d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
          weekNumber: weekNum,
        });
      }
      d.setDate(d.getDate() + 1);
    }

    await fetch('/api/admin/camps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: campName,
        startDate: season.startDate,
        endDate: season.endDate,
        locationId: loc.id,
        seasonId: season.id,
        allowsHaf: true,
        allowsPaid: loc.allowsPaid,
        days,
      }),
    });
    load();
  };

  const removeCampFromSeason = async (camp: CampInSeason) => {
    const label = camp.location ? camp.location.name : camp.name;
    if (camp._count.bookings > 0) {
      alert(`Cannot remove "${label}" — it has ${camp._count.bookings} booking(s). Cancel them first.`);
      return;
    }
    if (!confirm(`Remove "${label}" from this season? The camp and its days will be deleted.`)) return;
    const res = await fetch(`/api/admin/camps/${camp.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Remove failed');
      return;
    }
    load();
  };

  const getAvailableLocations = (season: Season) => {
    const usedIds = new Set(season.camps.map((c) => c.location?.id).filter(Boolean));
    return allLocations.filter((l) => !usedIds.has(l.id));
  };

  const openDateEditor = (camp: CampInSeason) => {
    setEditingDates(camp);
    setDateRanges(daysToRanges(camp.campDays));
  };

  const saveDates = async () => {
    if (!editingDates) return;
    setSavingDates(true);
    const newDays = rangesToDays(dateRanges);
    const sortedDates = newDays.map((d) => d.date).sort();
    if (sortedDates.length === 0) { setSavingDates(false); return; }
    const campStart = sortedDates[0];
    const campEnd = sortedDates[sortedDates.length - 1];
    await fetch(`/api/admin/camps/${editingDates.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: campStart, endDate: campEnd, days: newDays }),
    });
    const parentSeason = seasons.find((s) => s.camps.some((c) => c.id === editingDates.id));
    if (parentSeason) {
      const otherDates = parentSeason.camps
        .filter((c) => c.id !== editingDates.id)
        .flatMap((c) => c.campDays.map((d) => d.date.slice(0, 10)));
      const allDates = [...otherDates, ...sortedDates].sort();
      if (allDates.length > 0) {
        await fetch(`/api/admin/seasons/${parentSeason.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDate: allDates[0], endDate: allDates[allDates.length - 1] }),
        });
      }
    }
    setSavingDates(false);
    setEditingDates(null);
    load();
  };

  const updateDateRange = (idx: number, key: 'from' | 'to', value: string) => {
    setDateRanges((prev) => prev.map((r, i) => i === idx ? { ...r, [key]: value } : r));
  };

  const addDateRange = () => setDateRanges((prev) => [...prev, { from: '', to: '' }]);
  const removeDateRange = (idx: number) => setDateRanges((prev) => prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx));

  const generatedDays = rangesToDays(dateRanges);

  const togglePricing = (season: Season) => {
    if (expandedPricing === season.id) { setExpandedPricing(null); return; }
    setExpandedPricing(season.id);
    setEditTiers(
      season.priceTiers.length > 0
        ? season.priceTiers
            .sort((a, b) => a.days - b.days)
            .map((t) => ({ days: String(t.days), pricePence: String(t.pricePence) }))
        : [{ days: '', pricePence: '' }]
    );
  };

  const addTier = () => setEditTiers((prev) => [...prev, { days: '', pricePence: '' }]);
  const removeTier = (idx: number) => setEditTiers((prev) => prev.filter((_, i) => i !== idx));
  const updateTier = (idx: number, key: keyof EditTier, value: string) => {
    setEditTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, [key]: value } : t)));
  };

  const savePricing = async (seasonId: string) => {
    setSavingPricing(true);
    await fetch('/api/admin/settings/pricing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seasonId,
        tiers: editTiers
          .filter((t) => t.days && t.pricePence)
          .map((t) => ({ days: parseInt(t.days) || 0, pricePence: parseInt(t.pricePence) || 0 })),
      }),
    });
    setSavingPricing(false);
    load();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#003439] border-t-transparent rounded-full animate-spin" /></div>;
  }

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: 'active', label: 'Active', count: seasons.filter((s) => s.active).length },
    { key: 'inactive', label: 'Inactive', count: seasons.filter((s) => !s.active).length },
    { key: 'all', label: 'All', count: seasons.length },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#003439]">Seasons</h1>
          <p className="text-sm text-[#05575c]/60 mt-1">Manage camp seasons, locations, pricing, and configuration</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] transition-colors">
          <Plus size={16} /> New Season
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === t.key
                ? 'bg-white text-[#003439] shadow-sm'
                : 'text-[#05575c]/50 hover:text-[#003439]'
            }`}
          >
            {t.label}
            <span className={`ml-1.5 ${tab === t.key ? 'text-[#05575c]/40' : 'text-[#05575c]/25'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {filteredSeasons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <p className="text-[#05575c]/50">
            {tab === 'active' && seasons.length > 0
              ? 'No active seasons. Activate a season from the Inactive or All tab.'
              : tab === 'inactive' && seasons.length > 0
                ? 'No inactive seasons.'
                : 'No seasons yet. Create your first season to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSeasons.map((season) => {
            const available = getAvailableLocations(season);
            return (
              <div key={season.id} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#003439]">{season.title}</h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        season.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {season.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-[#05575c]/50 mt-1">
                      {formatDate(season.startDate)} &ndash; {formatDate(season.endDate)} &middot; {season.camps.length} location(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive(season)} className="p-2 rounded-lg hover:bg-gray-50 text-[#05575c]/40 hover:text-[#003439] transition-colors" title={season.active ? 'Deactivate' : 'Activate'}>
                      {season.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => openEdit(season)} className="p-2 rounded-lg hover:bg-gray-50 text-[#05575c]/40 hover:text-[#003439] transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(season)} className="p-2 rounded-lg hover:bg-red-50 text-[#05575c]/40 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Locations / camps */}
                <div className="border-t border-gray-50 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-[#05575c]/40 uppercase tracking-wider flex items-center gap-1">
                      <MapPin size={11} /> Locations
                    </span>
                    {available.length > 0 && (
                      <button
                        onClick={() => setAddingLocationFor(addingLocationFor === season.id ? null : season.id)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-[#003439]/60 hover:text-[#003439] transition-colors"
                      >
                        <Plus size={12} /> Add location
                      </button>
                    )}
                  </div>

                  {addingLocationFor === season.id && (
                    <div className="mb-3 flex items-center gap-2">
                      <select
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20"
                        defaultValue=""
                        onChange={(e) => { if (e.target.value) addLocationToSeason(season, e.target.value); }}
                      >
                        <option value="" disabled>Select a location to add...</option>
                        {available.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} ({loc.region})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setAddingLocationFor(null)}
                        className="p-2 rounded-lg hover:bg-gray-50 text-[#05575c]/30 hover:text-[#003439]"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {season.camps.length > 0 ? (
                    <div className="space-y-2">
                      {season.camps.map((camp) => (
                        <div key={camp.id} className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 transition-colors ${camp.active ? 'bg-gray-50' : 'bg-gray-50/50'}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => updateCamp(camp.id, { active: !camp.active })}
                              className={`shrink-0 w-8 h-[18px] rounded-full relative transition-colors ${camp.active ? 'bg-emerald-400' : 'bg-gray-300'}`}
                              title={camp.active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                            >
                              <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${camp.active ? 'left-[17px]' : 'left-0.5'}`} />
                            </button>
                            <span className={`truncate ${camp.active ? 'text-[#05575c]/70' : 'text-[#05575c]/30'}`}>
                              {camp.location ? camp.location.name : camp.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-3">
                            <button
                              onClick={() => updateCamp(camp.id, { allowsHaf: !camp.allowsHaf })}
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full transition-colors ${camp.allowsHaf ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              title={camp.allowsHaf ? 'HAF enabled — click to disable' : 'HAF disabled — click to enable'}
                            >
                              HAF
                            </button>
                            <button
                              onClick={() => updateCamp(camp.id, { allowsPaid: !camp.allowsPaid })}
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full transition-colors ${camp.allowsPaid ? 'bg-pink/20 text-[#ff00bf] hover:bg-pink/30' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              title={camp.allowsPaid ? 'Paid enabled — click to disable' : 'Paid disabled — click to enable'}
                            >
                              Paid
                            </button>
                            <Link
                              href={`/admin/bookings?campId=${camp.id}`}
                              className="text-xs text-[#05575c]/40 hover:text-[#003439] ml-1 w-16 text-right transition-colors"
                              title="View bookings"
                            >
                              {camp._count.bookings} booking{camp._count.bookings !== 1 ? 's' : ''}
                            </Link>
                            <button
                              onClick={() => openDateEditor(camp)}
                              className="p-1 rounded hover:bg-blue-50 text-[#05575c]/20 hover:text-blue-600 transition-colors ml-1"
                              title="Edit dates"
                            >
                              <Calendar size={13} />
                            </button>
                            <button
                              onClick={() => removeCampFromSeason(camp)}
                              className="p-1 rounded hover:bg-red-50 text-[#05575c]/20 hover:text-red-500 transition-colors ml-1"
                              title="Remove location from season"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#05575c]/30 italic py-1">
                      No locations added yet. Click &ldquo;Add location&rdquo; above.
                    </p>
                  )}
                </div>

                {/* Pricing section */}
                <div className="border-t border-gray-50 mt-3 pt-3">
                  <button
                    onClick={() => togglePricing(season)}
                    className="flex items-center gap-2 w-full text-left group"
                  >
                    <PoundSterling size={14} className="text-[#05575c]/40 group-hover:text-[#003439] transition-colors" />
                    <span className="text-xs font-semibold text-[#05575c]/60 group-hover:text-[#003439] transition-colors">
                      Pricing
                    </span>
                    {season.priceTiers.length > 0 && (
                      <span className="text-[10px] text-[#05575c]/30">
                        ({season.priceTiers.length} tier{season.priceTiers.length !== 1 ? 's' : ''})
                      </span>
                    )}
                    {season.priceTiers.length === 0 && (
                      <span className="text-[10px] text-amber-500 font-medium">No pricing set</span>
                    )}
                    <span className="ml-auto text-[#05575c]/30 group-hover:text-[#003439] transition-colors">
                      {expandedPricing === season.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </button>

                  {expandedPricing === season.id && (
                    <div className="mt-3 bg-gray-50/80 rounded-xl p-4">
                      <div className="space-y-2 mb-3">
                        <div className="grid grid-cols-[1fr_1fr_32px] gap-2 text-[10px] font-semibold text-[#05575c]/40 uppercase tracking-wider px-0.5">
                          <span>Days</span>
                          <span>Price (pence)</span>
                          <span />
                        </div>
                        {editTiers.map((tier, idx) => (
                          <div key={idx} className="grid grid-cols-[1fr_1fr_32px] gap-2 items-center">
                            <input
                              type="number"
                              min="1"
                              value={tier.days}
                              onChange={(e) => updateTier(idx, 'days', e.target.value)}
                              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20"
                              placeholder="e.g. 1"
                            />
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                value={tier.pricePence}
                                onChange={(e) => updateTier(idx, 'pricePence', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20 pr-16"
                                placeholder="e.g. 2500"
                              />
                              {tier.pricePence && (
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#05575c]/40 font-medium">
                                  = £{(parseInt(tier.pricePence) / 100).toFixed(2)}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => removeTier(idx)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-[#05575c]/25 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={addTier}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-gray-300 text-[11px] text-[#05575c]/40 hover:border-[#003439] hover:text-[#003439] transition-colors"
                        >
                          <Plus size={12} /> Add tier
                        </button>
                        <div className="flex-1" />
                        <button
                          onClick={() => savePricing(season.id)}
                          disabled={savingPricing}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#003439] text-white text-xs font-semibold hover:bg-[#004a52] disabled:opacity-40 transition-colors"
                        >
                          <Save size={13} /> {savingPricing ? 'Saving...' : 'Save pricing'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#003439] mb-4">{editing ? 'Edit Season' : 'New Season'}</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#003439] mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20"
                  placeholder="e.g. Easter 2026"
                />
              </div>
              {!editing && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#003439] mb-1">Start Date</label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#003439] mb-1">End Date</label>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-[#05575c]/40">These dates are used to generate initial camp days when you add locations. After that, dates are managed per-location.</p>
                </>
              )}
              {editing && editing.camps.length > 0 && (
                <p className="text-xs text-[#05575c]/50 bg-gray-50 px-3 py-2 rounded-lg">
                  Season dates are auto-updated from each location&apos;s dates. Use the <Calendar size={11} className="inline -mt-0.5" /> button on each location to edit dates.
                </p>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-[#003439] focus:ring-[#003439]"
                />
                <span className="text-sm text-[#003439]">Active (visible on public site)</span>
              </label>
              {form.active && !editing?.active && (
                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">This will deactivate all other seasons.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm text-[#05575c]/60 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title || (!editing && (!form.startDate || !form.endDate))} className="px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] disabled:opacity-40">
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date editing modal */}
      {editingDates && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setEditingDates(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#003439] mb-1">Edit Dates</h2>
            <p className="text-xs text-[#05575c]/50 mb-4">{editingDates.location?.name || editingDates.name}</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#003439] mb-1.5">Camp Day Ranges</label>
                <p className="text-[10px] text-[#05575c]/40 mb-2">Weekdays (Mon-Fri) within each range are included automatically.</p>
                <div className="space-y-2">
                  {dateRanges.map((range, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input type="date" value={range.from} onChange={(e) => updateDateRange(idx, 'from', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" />
                        <input type="date" value={range.to} onChange={(e) => updateDateRange(idx, 'to', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" />
                      </div>
                      {dateRanges.length > 1 && (
                        <button type="button" onClick={() => removeDateRange(idx)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#05575c]/30 hover:text-red-500 transition-colors"><X size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addDateRange} className="mt-2 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-[#05575c]/50 hover:border-[#003439] hover:text-[#003439] transition-colors">
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
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEditingDates(null)} className="px-4 py-2 rounded-xl text-sm text-[#05575c]/60 hover:bg-gray-50">Cancel</button>
              <button onClick={saveDates} disabled={savingDates || generatedDays.length === 0} className="px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] disabled:opacity-40">
                {savingDates ? 'Saving...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getISOWeek(d: Date): number {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}
