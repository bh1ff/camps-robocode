'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, CreditCard, Check, X as XIcon } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  slug: string;
  address: string;
  region: string;
  capacityPerDay: number;
  hafSeatsTotal: number;
  allowsPaid: boolean;
  stripeSecretKey: string | null;
  stripePublishableKey: string | null;
  stripeConnected: boolean;
  camps: { id: string; name: string; season: { title: string } | null; _count: { bookings: number } }[];
}

const EMPTY_FORM = {
  name: '', slug: '', address: '', region: 'solihull',
  capacityPerDay: '30', hafSeatsTotal: '100', allowsPaid: false,
  stripeSecretKey: '', stripePublishableKey: '', stripeWebhookSecret: '',
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showStripe, setShowStripe] = useState(false);

  const load = useCallback(() => {
    fetch('/api/admin/locations')
      .then((r) => r.json())
      .then(setLocations)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowStripe(false);
    setShowModal(true);
  };

  const openEdit = (loc: Location) => {
    setEditing(loc);
    setForm({
      name: loc.name,
      slug: loc.slug,
      address: loc.address,
      region: loc.region,
      capacityPerDay: String(loc.capacityPerDay),
      hafSeatsTotal: String(loc.hafSeatsTotal),
      allowsPaid: loc.allowsPaid,
      stripeSecretKey: '',
      stripePublishableKey: loc.stripePublishableKey || '',
      stripeWebhookSecret: '',
    });
    setShowStripe(loc.stripeConnected);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const url = editing ? `/api/admin/locations/${editing.id}` : '/api/admin/locations';
    const method = editing ? 'PUT' : 'POST';

    const payload: Record<string, unknown> = {
      name: form.name,
      slug: form.slug,
      address: form.address,
      region: form.region,
      capacityPerDay: form.capacityPerDay,
      hafSeatsTotal: form.hafSeatsTotal,
      allowsPaid: form.allowsPaid,
    };

    if (form.stripeSecretKey) payload.stripeSecretKey = form.stripeSecretKey;
    if (form.stripePublishableKey) payload.stripePublishableKey = form.stripePublishableKey;
    if (form.stripeWebhookSecret) payload.stripeWebhookSecret = form.stripeWebhookSecret;

    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setSaving(false);
    setShowModal(false);
    load();
  };

  const handleDelete = async (loc: Location) => {
    if (!confirm(`Delete "${loc.name}"?`)) return;
    const res = await fetch(`/api/admin/locations/${loc.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Delete failed');
      return;
    }
    load();
  };

  const updateForm = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#003439] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#003439]">Locations</h1>
          <p className="text-sm text-[#05575c]/60 mt-1">Manage camp venues and Stripe configuration</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] transition-colors">
          <Plus size={16} /> New Location
        </button>
      </div>

      {locations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <p className="text-[#05575c]/50">No locations yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {locations.map((loc) => (
            <div key={loc.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-[#003439]">{loc.name}</h3>
                  <p className="text-xs text-[#05575c]/50 mt-0.5">{loc.address}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(loc)} className="p-2 rounded-lg hover:bg-gray-50 text-[#05575c]/40 hover:text-[#003439]">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(loc)} className="p-2 rounded-lg hover:bg-red-50 text-[#05575c]/40 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">{loc.region}</span>
                {loc.allowsPaid && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">Paid</span>}
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">HAF</span>
                {loc.stripeConnected ? (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 flex items-center gap-1">
                    <CreditCard size={10} /> Stripe
                  </span>
                ) : loc.allowsPaid ? (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                    <CreditCard size={10} /> No Stripe
                  </span>
                ) : null}
              </div>

              <div className="text-xs text-[#05575c]/50 space-y-0.5">
                <p>Capacity: {loc.capacityPerDay}/day &middot; HAF seats: {loc.hafSeatsTotal}</p>
                <p>{loc.camps.length} camp(s)</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#003439] mb-4">{editing ? 'Edit Location' : 'New Location'}</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#003439] mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => updateForm('name', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" placeholder="e.g. Robocode Shirley Centre" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#003439] mb-1">Slug</label>
                  <input type="text" value={form.slug} onChange={(e) => updateForm('slug', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" placeholder="e.g. shirley" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#003439] mb-1">Region</label>
                  <select value={form.region} onChange={(e) => updateForm('region', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20">
                    <option value="solihull">Solihull</option>
                    <option value="birmingham">Birmingham</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#003439] mb-1">Address</label>
                <input type="text" value={form.address} onChange={(e) => updateForm('address', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#003439] mb-1">Capacity / Day</label>
                  <input type="number" value={form.capacityPerDay} onChange={(e) => updateForm('capacityPerDay', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#003439] mb-1">HAF Seats Total</label>
                  <input type="number" value={form.hafSeatsTotal} onChange={(e) => updateForm('hafSeatsTotal', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.allowsPaid} onChange={(e) => updateForm('allowsPaid', e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
                <span className="text-sm text-[#003439]">Allow paid bookings</span>
              </label>

              {form.allowsPaid && (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <button type="button" onClick={() => setShowStripe(!showStripe)} className="flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700 mb-3">
                    <CreditCard size={16} />
                    {showStripe ? 'Hide Stripe Settings' : 'Configure Stripe'}
                  </button>

                  {showStripe && (
                    <div className="space-y-3 bg-violet-50/50 p-3 rounded-xl">
                      {editing?.stripeConnected && (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                          <Check size={14} /> Stripe connected (key: {editing.stripeSecretKey})
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-[#003439] mb-1">Publishable Key</label>
                        <input type="text" value={form.stripePublishableKey} onChange={(e) => updateForm('stripePublishableKey', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="pk_live_..." />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#003439] mb-1">Secret Key {editing?.stripeConnected && '(leave blank to keep current)'}</label>
                        <input type="password" value={form.stripeSecretKey} onChange={(e) => updateForm('stripeSecretKey', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="sk_live_..." />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#003439] mb-1">Webhook Secret {editing?.stripeConnected && '(leave blank to keep current)'}</label>
                        <input type="password" value={form.stripeWebhookSecret} onChange={(e) => updateForm('stripeWebhookSecret', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="whsec_..." />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm text-[#05575c]/60 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.region} className="px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] disabled:opacity-40">
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
