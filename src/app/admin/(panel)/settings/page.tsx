'use client';

import { useEffect, useState, useCallback } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';

interface PriceTier {
  id: string;
  days: number;
  pricePence: number;
  order: number;
  seasonId: string | null;
  season: { id: string; title: string } | null;
}

interface Season {
  id: string;
  title: string;
}

export default function SettingsPage() {
  const [tiers, setTiers] = useState<PriceTier[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editTiers, setEditTiers] = useState<{ days: string; pricePence: string }[]>([]);

  const loadSeasons = useCallback(async () => {
    const res = await fetch('/api/admin/seasons');
    const data = await res.json();
    setSeasons(data);
    if (data.length > 0 && !selectedSeason) {
      setSelectedSeason(data[0].id);
    }
  }, [selectedSeason]);

  const loadTiers = useCallback(async () => {
    if (!selectedSeason) return;
    const res = await fetch(`/api/admin/settings/pricing?seasonId=${selectedSeason}`);
    const data = await res.json();
    setTiers(data);
    setEditTiers(data.map((t: PriceTier) => ({
      days: String(t.days),
      pricePence: String(t.pricePence),
    })));
    setLoading(false);
  }, [selectedSeason]);

  useEffect(() => { loadSeasons(); }, [loadSeasons]);
  useEffect(() => { if (selectedSeason) loadTiers(); }, [selectedSeason, loadTiers]);

  const addTier = () => {
    setEditTiers((prev) => [...prev, { days: '', pricePence: '' }]);
  };

  const removeTier = (idx: number) => {
    setEditTiers((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateTier = (idx: number, key: string, value: string) => {
    setEditTiers((prev) => prev.map((t, i) => i === idx ? { ...t, [key]: value } : t));
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/admin/settings/pricing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seasonId: selectedSeason,
        tiers: editTiers.map((t) => ({
          days: parseInt(t.days) || 0,
          pricePence: parseInt(t.pricePence) || 0,
        })),
      }),
    });
    setSaving(false);
    loadTiers();
  };

  if (loading && seasons.length === 0) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#003439] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#003439]">Settings</h1>
        <p className="text-sm text-[#05575c]/60 mt-1">Manage pricing tiers and configuration</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 max-w-2xl">
        <h2 className="text-sm font-bold text-[#003439] mb-4">Pricing Tiers</h2>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#003439] mb-1">Season</label>
          <select
            value={selectedSeason}
            onChange={(e) => { setSelectedSeason(e.target.value); setLoading(true); }}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20"
          >
            {seasons.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>

        <div className="space-y-2 mb-4">
          <div className="grid grid-cols-[1fr_1fr_40px] gap-2 text-xs font-semibold text-[#05575c]/50 px-1">
            <span>Days</span>
            <span>Price (pence)</span>
            <span />
          </div>
          {editTiers.map((tier, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center">
              <input
                type="number"
                value={tier.days}
                onChange={(e) => updateTier(idx, 'days', e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20"
                placeholder="e.g. 1"
              />
              <div className="relative">
                <input
                  type="number"
                  value={tier.pricePence}
                  onChange={(e) => updateTier(idx, 'pricePence', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20"
                  placeholder="e.g. 2500"
                />
                {tier.pricePence && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#05575c]/40">
                    = £{(parseInt(tier.pricePence) / 100).toFixed(2)}
                  </span>
                )}
              </div>
              <button onClick={() => removeTier(idx)} className="p-2 rounded-lg hover:bg-red-50 text-[#05575c]/30 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={addTier} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-[#05575c]/50 hover:border-[#003439] hover:text-[#003439] transition-colors">
            <Plus size={14} /> Add tier
          </button>
          <div className="flex-1" />
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] disabled:opacity-40">
            <Save size={16} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
