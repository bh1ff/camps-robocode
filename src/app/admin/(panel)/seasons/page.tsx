'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface Season {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  endDate: string;
  active: boolean;
  camps: { id: string; name: string; location: { name: string } | null; _count: { bookings: number } }[];
  priceTiers: { id: string; days: number; pricePence: number }[];
}

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Season | null>(null);
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', active: true });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch('/api/admin/seasons')
      .then((r) => r.json())
      .then(setSeasons)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

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
    await fetch(`/api/admin/seasons/${season.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !season.active }),
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

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#003439] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#003439]">Seasons</h1>
          <p className="text-sm text-[#05575c]/60 mt-1">Manage camp seasons (e.g. Easter, Summer, Half Term)</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] transition-colors">
          <Plus size={16} /> New Season
        </button>
      </div>

      {seasons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <p className="text-[#05575c]/50">No seasons yet. Create your first season to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {seasons.map((season) => (
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
                    {formatDate(season.startDate)} &ndash; {formatDate(season.endDate)} &middot; {season.camps.length} camp(s)
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

              {season.camps.length > 0 && (
                <div className="border-t border-gray-50 pt-3 space-y-1.5">
                  {season.camps.map((camp) => (
                    <div key={camp.id} className="flex items-center justify-between text-sm">
                      <span className="text-[#05575c]/70">{camp.name} {camp.location && <span className="text-[#05575c]/40">({camp.location.name})</span>}</span>
                      <span className="text-xs text-[#05575c]/40">{camp._count.bookings} bookings</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-[#003439] focus:ring-[#003439]"
                />
                <span className="text-sm text-[#003439]">Active (visible on public site)</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm text-[#05575c]/60 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title || !form.startDate || !form.endDate} className="px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] disabled:opacity-40">
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
