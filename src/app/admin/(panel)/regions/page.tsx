'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, CreditCard, Check, X as XIcon,
  ChevronDown, ChevronUp, ExternalLink, MapPin, ImageIcon, Upload,
} from 'lucide-react';
import Image from 'next/image';

interface LocationData {
  id: string;
  name: string;
  slug: string;
  address: string;
  region: string;
  imageUrl: string | null;
  capacityPerDay: number;
  hafSeatsTotal: number;
  allowsPaid: boolean;
  stripeSecretKey: string | null;
  stripePublishableKey: string | null;
  stripeConnected: boolean;
  camps: { id: string; name: string; active: boolean; season: { title: string; active: boolean } | null; _count: { bookings: number } }[];
}

interface RegionData {
  id: string;
  name: string;
  slug: string;
  locations: LocationData[];
}

const EMPTY_LOC = {
  name: '', slug: '', address: '', imageUrl: '',
  capacityPerDay: '30', hafSeatsTotal: '100',
  stripeSecretKey: '', stripePublishableKey: '', stripeWebhookSecret: '',
};

const EMPTY_REGION = { name: '' };

export default function RegionsPage() {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [showRegionModal, setShowRegionModal] = useState(false);
  const [editingRegion, setEditingRegion] = useState<RegionData | null>(null);
  const [regionForm, setRegionForm] = useState(EMPTY_REGION);

  const [showLocModal, setShowLocModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState<LocationData | null>(null);
  const [locRegionSlug, setLocRegionSlug] = useState('');
  const [locForm, setLocForm] = useState(EMPTY_LOC);
  const [showStripe, setShowStripe] = useState(false);

  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch('/api/admin/regions')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setRegions(data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: string) => setExpanded((prev) => prev === id ? null : id);

  /* ── Region CRUD ── */
  const openCreateRegion = () => {
    setEditingRegion(null);
    setRegionForm(EMPTY_REGION);
    setShowRegionModal(true);
  };

  const openEditRegion = (r: RegionData) => {
    setEditingRegion(r);
    setRegionForm({ name: r.name });
    setShowRegionModal(true);
  };

  const saveRegion = async () => {
    setSaving(true);
    const url = editingRegion ? `/api/admin/regions/${editingRegion.id}` : '/api/admin/regions';
    const method = editingRegion ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: regionForm.name, slug: regionForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }),
    });
    setSaving(false);
    setShowRegionModal(false);
    load();
  };

  const deleteRegion = async (r: RegionData) => {
    if (!confirm(`Delete region "${r.name}"?`)) return;
    const res = await fetch(`/api/admin/regions/${r.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Delete failed');
      return;
    }
    load();
  };

  /* ── Location CRUD ── */
  const openCreateLoc = (regionSlug: string) => {
    setEditingLoc(null);
    setLocRegionSlug(regionSlug);
    setLocForm(EMPTY_LOC);
    setShowStripe(false);
    setShowLocModal(true);
  };

  const openEditLoc = (loc: LocationData) => {
    setEditingLoc(loc);
    setLocRegionSlug(loc.region);
    setLocForm({
      name: loc.name,
      slug: loc.slug,
      address: loc.address,
      imageUrl: loc.imageUrl || '',
      capacityPerDay: String(loc.capacityPerDay),
      hafSeatsTotal: String(loc.hafSeatsTotal),
      stripeSecretKey: '',
      stripePublishableKey: loc.stripePublishableKey || '',
      stripeWebhookSecret: '',
    });
    setShowStripe(loc.stripeConnected);
    setShowLocModal(true);
  };

  const saveLoc = async () => {
    setSaving(true);
    const url = editingLoc ? `/api/admin/locations/${editingLoc.id}` : '/api/admin/locations';
    const method = editingLoc ? 'PUT' : 'POST';

    const payload: Record<string, unknown> = {
      name: locForm.name,
      slug: locForm.slug,
      address: locForm.address,
      imageUrl: locForm.imageUrl || null,
      region: locRegionSlug,
      capacityPerDay: locForm.capacityPerDay,
      hafSeatsTotal: locForm.hafSeatsTotal,
    };

    if (locForm.stripeSecretKey) payload.stripeSecretKey = locForm.stripeSecretKey;
    if (locForm.stripePublishableKey) payload.stripePublishableKey = locForm.stripePublishableKey;
    if (locForm.stripeWebhookSecret) payload.stripeWebhookSecret = locForm.stripeWebhookSecret;

    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setSaving(false);
    setShowLocModal(false);
    load();
  };

  const deleteLoc = async (loc: LocationData) => {
    if (!confirm(`Delete "${loc.name}"?`)) return;
    const res = await fetch(`/api/admin/locations/${loc.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Delete failed');
      return;
    }
    load();
  };

  const updateLoc = (key: string, value: unknown) => setLocForm((f) => ({ ...f, [key]: value }));

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#003439] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#003439]">Regions</h1>
          <p className="text-sm text-[#05575c]/60 mt-1">Manage regions and their venues</p>
        </div>
        <button onClick={openCreateRegion} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] transition-colors">
          <Plus size={16} /> New Region
        </button>
      </div>

      {regions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <p className="text-[#05575c]/50">No regions yet. Create your first region to start adding locations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {regions.map((region) => (
            <div key={region.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Region header */}
              <div className="flex items-center justify-between px-5 py-4">
                <button onClick={() => toggle(region.id)} className="flex items-center gap-3 text-left flex-1">
                  {expanded === region.id ? <ChevronUp size={16} className="text-[#05575c]/40" /> : <ChevronDown size={16} className="text-[#05575c]/40" />}
                  <div>
                    <h3 className="font-bold text-[#003439]">{region.name}</h3>
                    <p className="text-xs text-[#05575c]/50 mt-0.5">{region.locations.length} location(s) &middot; slug: {region.slug}</p>
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditRegion(region)} className="p-2 rounded-lg hover:bg-gray-50 text-[#05575c]/40 hover:text-[#003439]"><Pencil size={16} /></button>
                  <button onClick={() => deleteRegion(region)} className="p-2 rounded-lg hover:bg-red-50 text-[#05575c]/40 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>

              {/* Expanded: locations list */}
              {expanded === region.id && (
                <div className="border-t border-gray-100 px-5 pb-4">
                  {region.locations.length === 0 ? (
                    <p className="text-sm text-[#05575c]/40 py-4 text-center">No locations in this region yet.</p>
                  ) : (
                    <div className="space-y-2 mt-3">
                      {region.locations.map((loc) => (
                        <div key={loc.id} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex gap-3">
                              {loc.imageUrl ? (
                                <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                  <Image src={loc.imageUrl} alt={loc.name} fill className="object-cover" sizes="64px" />
                                </div>
                              ) : (
                                <div className="w-16 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                                  <ImageIcon size={16} className="text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <MapPin size={14} className="text-[#05575c]/40" />
                                  <h4 className="font-semibold text-sm text-[#003439]">{loc.name}</h4>
                                </div>
                                <p className="text-xs text-[#05575c]/50 mt-0.5 ml-[22px]">{loc.address}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <a
                                href={`/book/paid?location=${loc.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg hover:bg-blue-50 text-[#05575c]/40 hover:text-blue-600"
                                title="Test this location"
                              >
                                <ExternalLink size={14} />
                              </a>
                              <button onClick={() => openEditLoc(loc)} className="p-2 rounded-lg hover:bg-gray-100 text-[#05575c]/40 hover:text-[#003439]"><Pencil size={14} /></button>
                              <button onClick={() => deleteLoc(loc)} className="p-2 rounded-lg hover:bg-red-50 text-[#05575c]/40 hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                          </div>

                          <div className="ml-[22px] flex flex-wrap gap-1.5 mb-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[#05575c]/60">/{loc.slug}</span>
                            {loc.stripeConnected && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 flex items-center gap-1">
                                <CreditCard size={10} /> Stripe
                              </span>
                            )}
                          </div>

                          <div className="ml-[22px] text-xs text-[#05575c]/50">
                            Capacity: {loc.capacityPerDay}/day &middot; HAF seats: {loc.hafSeatsTotal}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => openCreateLoc(region.slug)}
                    className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-[#05575c]/50 hover:border-[#003439] hover:text-[#003439] transition-colors w-full justify-center"
                  >
                    <Plus size={14} /> Add Location to {region.name}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Region Modal */}
      {showRegionModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowRegionModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#003439] mb-4">{editingRegion ? 'Edit Region' : 'New Region'}</h2>
            <div>
              <label className="block text-xs font-semibold text-[#003439] mb-1">Region Name</label>
              <input type="text" value={regionForm.name} onChange={(e) => setRegionForm({ name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" placeholder="e.g. Solihull" />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowRegionModal(false)} className="px-4 py-2 rounded-xl text-sm text-[#05575c]/60 hover:bg-gray-50">Cancel</button>
              <button onClick={saveRegion} disabled={saving || !regionForm.name} className="px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] disabled:opacity-40">
                {saving ? 'Saving...' : editingRegion ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowLocModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#003439] mb-4">{editingLoc ? 'Edit Location' : 'New Location'}</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#003439] mb-1">Name</label>
                <input type="text" value={locForm.name} onChange={(e) => updateLoc('name', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" placeholder="e.g. Robocode Shirley Centre" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#003439] mb-1">Slug</label>
                <input type="text" value={locForm.slug} onChange={(e) => updateLoc('slug', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" placeholder="e.g. shirley" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#003439] mb-1">Address</label>
                <input type="text" value={locForm.address} onChange={(e) => updateLoc('address', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" />
              </div>

              {/* Venue Image */}
              <div>
                <label className="block text-xs font-semibold text-[#003439] mb-1">Venue Image</label>
                {locForm.imageUrl && (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden mb-2 border border-gray-200">
                    <Image src={locForm.imageUrl} alt="Venue preview" fill className="object-cover" sizes="400px" />
                    <button
                      type="button"
                      onClick={() => updateLoc('imageUrl', '')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <XIcon size={12} />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={locForm.imageUrl}
                    onChange={(e) => updateLoc('imageUrl', e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20"
                    placeholder="/camp/location-name.jpg"
                  />
                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-[#05575c]/60 hover:border-[#003439] hover:text-[#003439] cursor-pointer transition-colors">
                    <Upload size={14} />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('file', file);
                        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
                        if (res.ok) {
                          const { url } = await res.json();
                          updateLoc('imageUrl', url);
                        }
                      }}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-[#05575c]/40 mt-1">Path to image in /public/camp/ or upload a new one</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#003439] mb-1">Capacity / Day</label>
                  <input type="number" value={locForm.capacityPerDay} onChange={(e) => updateLoc('capacityPerDay', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#003439] mb-1">HAF Seats Total</label>
                  <input type="number" value={locForm.hafSeatsTotal} onChange={(e) => updateLoc('hafSeatsTotal', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 mt-3">
                <button type="button" onClick={() => setShowStripe(!showStripe)} className="flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700 mb-3">
                  <CreditCard size={16} />
                  {showStripe ? 'Hide Stripe Settings' : 'Configure Stripe'}
                </button>

                {showStripe && (
                  <div className="space-y-3 bg-violet-50/50 p-3 rounded-xl">
                    {editingLoc?.stripeConnected && (
                      <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                        <Check size={14} /> Stripe connected (key: {editingLoc.stripeSecretKey})
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-[#003439] mb-1">Publishable Key</label>
                      <input type="text" value={locForm.stripePublishableKey} onChange={(e) => updateLoc('stripePublishableKey', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="pk_live_..." />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#003439] mb-1">Secret Key {editingLoc?.stripeConnected && '(leave blank to keep current)'}</label>
                      <input type="password" value={locForm.stripeSecretKey} onChange={(e) => updateLoc('stripeSecretKey', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="sk_live_..." />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#003439] mb-1">Webhook Secret {editingLoc?.stripeConnected && '(leave blank to keep current)'}</label>
                      <input type="password" value={locForm.stripeWebhookSecret} onChange={(e) => updateLoc('stripeWebhookSecret', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="whsec_..." />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowLocModal(false)} className="px-4 py-2 rounded-xl text-sm text-[#05575c]/60 hover:bg-gray-50">Cancel</button>
              <button onClick={saveLoc} disabled={saving || !locForm.name} className="px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] disabled:opacity-40">
                {saving ? 'Saving...' : editingLoc ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
