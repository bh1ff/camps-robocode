'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search, Download, ChevronDown, ChevronUp, Check, X as XIcon, Clock,
  Plus, Send, Link2, RotateCcw, Trash2, Mail, MessageSquare,
} from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'haf', label: 'HAF (Free)' },
  { value: 'stripe', label: 'Stripe (Online)' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'childcare_voucher', label: 'Childcare Voucher' },
  { value: 'childcare_grant', label: 'Childcare Grant' },
  { value: 'tax_free_childcare', label: 'Tax Free Childcare' },
  { value: 'no_payment', label: 'No Payment Required' },
] as const;

const PAID_METHODS = PAYMENT_METHODS.filter((m) => !['haf', 'stripe'].includes(m.value));

function paymentLabel(method: string): string {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label || method;
}

function paymentBadgeClass(method: string): string {
  switch (method) {
    case 'haf': return 'bg-emerald-100 text-emerald-700';
    case 'stripe': return 'bg-violet-100 text-violet-700';
    case 'cash': return 'bg-amber-100 text-amber-700';
    case 'bank_transfer': return 'bg-blue-100 text-blue-700';
    case 'childcare_voucher': return 'bg-indigo-100 text-indigo-700';
    case 'childcare_grant': return 'bg-teal-100 text-teal-700';
    case 'tax_free_childcare': return 'bg-cyan-100 text-cyan-700';
    case 'no_payment': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-700';
  }
}

interface ChildData {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  schoolName: string | null;
  hafCode: string | null;
  hasSEND: boolean;
  hasAllergies: boolean;
  allergyDetails: string | null;
  dayBookings: { campDay: { dayLabel: string } }[];
}

interface BookingData {
  id: string;
  type: string;
  status: string;
  paymentMethod: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  address: string;
  postcode: string;
  hafCode: string | null;
  totalAmount: number;
  createdAt: string;
  children: ChildData[];
  camp: { name: string; location: { name: string } | null; season: { title: string } | null };
}

interface CampOption {
  id: string;
  name: string;
  seasonTitle: string;
  locationName: string;
  allowsHaf: boolean;
  campDays: { id: string; dayLabel: string; date: string; weekNumber: number }[];
}

interface TokenData {
  id: string;
  token: string;
  parentEmail: string;
  parentPhone: string | null;
  sendMethod: string;
  paymentMethod: string;
  used: boolean;
  createdAt: string;
  camp: { name: string; location: { name: string } | null };
}

const EMPTY_CHILD = { firstName: '', lastName: '', dateOfBirth: '', age: '', schoolName: '', hafCode: '', hasSEND: false, hasAllergies: false, allergyDetails: '', photoPermission: false };

function BookingsPageInner() {
  const searchParams = useSearchParams();
  const initialCampId = searchParams.get('campId') || '';

  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [camps, setCamps] = useState<CampOption[]>([]);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', status: '', search: '', campId: initialCampId, season: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── New Booking state ── */
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [newBookingStep, setNewBookingStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [nbSeason, setNbSeason] = useState('');
  const [nbCampId, setNbCampId] = useState('');
  const [nbType, setNbType] = useState<'haf' | 'paid'>('paid');
  const [nbPaymentMethod, setNbPaymentMethod] = useState('cash');
  const [nbParent, setNbParent] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', postcode: '' });
  const [nbChildren, setNbChildren] = useState([{ ...EMPTY_CHILD }]);
  const [nbSelectedDays, setNbSelectedDays] = useState<string[]>([]);

  /* ── Send Link state ── */
  const [showSendLink, setShowSendLink] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const [linkSeason, setLinkSeason] = useState('');
  const [linkCampId, setLinkCampId] = useState('');
  const [linkType, setLinkType] = useState<'haf' | 'paid'>('paid');
  const [linkPaymentMethod, setLinkPaymentMethod] = useState('cash');
  const [linkSendMethod, setLinkSendMethod] = useState<'email' | 'sms' | 'both'>('email');
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPhone, setLinkPhone] = useState('');
  const [linkSending, setLinkSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  useEffect(() => {
    fetch('/api/admin/camps')
      .then((r) => r.json())
      .then((data: { id: string; name: string; allowsHaf: boolean; season: { title: string } | null; location: { name: string } | null; campDays: { id: string; dayLabel: string; date: string; weekNumber: number }[] }[]) => {
        if (!Array.isArray(data)) return;
        setCamps(data.map((c) => ({
          id: c.id, name: c.name,
          seasonTitle: c.season?.title || '',
          locationName: c.location?.name || c.name,
          allowsHaf: c.allowsHaf ?? false,
          campDays: c.campDays || [],
        })));
      });
    loadTokens();
  }, []);

  const loadTokens = () => {
    fetch('/api/admin/booking-links')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTokens(data); })
      .catch(() => {});
  };

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (filter.type) params.set('type', filter.type);
    if (filter.status) params.set('status', filter.status);
    if (filter.search) params.set('search', filter.search);
    if (filter.campId) params.set('campId', filter.campId);
    if (filter.season) params.set('season', filter.season);
    fetch(`/api/admin/bookings?${params}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setBookings(d); })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/bookings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    load();
  };

  const exportCSV = () => {
    const rows = [['Parent', 'Email', 'Phone', 'Type', 'Status', 'Payment Method', 'Location', 'Children', 'Amount', 'Date']];
    bookings.forEach((b) => {
      rows.push([
        `${b.parentFirstName} ${b.parentLastName}`, b.parentEmail, b.parentPhone, b.type, b.status,
        paymentLabel(b.paymentMethod || 'stripe'),
        b.camp.location?.name || b.camp.name, String(b.children.length),
        b.type === 'paid' ? `£${b.totalAmount}` : 'Free',
        new Date(b.createdAt).toLocaleDateString('en-GB'),
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bookings-export-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  const statusIcon = (status: string) => {
    if (status === 'confirmed') return <Check size={12} className="text-emerald-600" />;
    if (status === 'cancelled') return <XIcon size={12} className="text-red-500" />;
    return <Clock size={12} className="text-amber-500" />;
  };

  /* ── New Booking ── */
  const seasonList = [...new Set(camps.map((c) => c.seasonTitle))].filter(Boolean);
  const nbFilteredCamps = nbSeason ? camps.filter((c) => c.seasonTitle === nbSeason) : camps;
  const nbCamp = camps.find((c) => c.id === nbCampId);
  const nbCampAllowsHaf = nbCamp?.allowsHaf ?? false;
  const nbDays = nbCamp?.campDays || [];
  const nbWeeks = [...new Set(nbDays.map((d) => d.weekNumber))].sort((a, b) => a - b);
  const nbEffectivePayment = nbType === 'haf' ? 'haf' : nbPaymentMethod;

  const openNewBooking = () => {
    const defaultSeason = seasonList[0] || '';
    setNbSeason(defaultSeason);
    const filtered = defaultSeason ? camps.filter((c) => c.seasonTitle === defaultSeason) : camps;
    const first = filtered[0];
    setNbCampId(first?.id || '');
    setNbType('paid');
    setNbPaymentMethod('cash');
    setNbParent({ firstName: '', lastName: '', email: '', phone: '', address: '', postcode: '' });
    setNbChildren([{ ...EMPTY_CHILD }]);
    setNbSelectedDays([]);
    setNewBookingStep(0);
    setShowNewBooking(true);
  };

  const handleNbSeasonChange = (season: string) => {
    setNbSeason(season);
    const filtered = season ? camps.filter((c) => c.seasonTitle === season) : camps;
    const first = filtered[0];
    setNbCampId(first?.id || '');
    setNbSelectedDays([]);
    if (first && !first.allowsHaf && nbType === 'haf') setNbType('paid');
  };

  const handleNbCampChange = (campId: string) => {
    setNbCampId(campId);
    setNbSelectedDays([]);
    const camp = camps.find((c) => c.id === campId);
    if (camp && !camp.allowsHaf && nbType === 'haf') setNbType('paid');
  };

  const submitNewBooking = async () => {
    setSaving(true);
    await fetch('/api/admin/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campId: nbCampId,
        paymentMethod: nbEffectivePayment,
        parentFirstName: nbParent.firstName,
        parentLastName: nbParent.lastName,
        parentEmail: nbParent.email,
        parentPhone: nbParent.phone,
        address: nbParent.address,
        postcode: nbParent.postcode,
        totalAmount: 0,
        children: nbChildren,
        selectedDays: nbSelectedDays,
      }),
    });
    setSaving(false);
    setShowNewBooking(false);
    load();
  };

  const updateNbChild = (i: number, key: string, val: unknown) => {
    setNbChildren((prev) => { const c = [...prev]; c[i] = { ...c[i], [key]: val }; return c; });
  };

  /* ── Send Link ── */
  const linkFilteredCamps = linkSeason ? camps.filter((c) => c.seasonTitle === linkSeason) : camps;
  const linkCamp = camps.find((c) => c.id === linkCampId);
  const linkCampAllowsHaf = linkCamp?.allowsHaf ?? false;

  const openSendLink = () => {
    const defaultSeason = seasonList[0] || '';
    setLinkSeason(defaultSeason);
    const filtered = defaultSeason ? camps.filter((c) => c.seasonTitle === defaultSeason) : camps;
    const first = filtered[0];
    setLinkCampId(first?.id || '');
    setLinkType('paid');
    setLinkPaymentMethod('cash');
    setLinkSendMethod('email');
    setLinkEmail('');
    setLinkPhone('');
    setLinkSent(false);
    setShowSendLink(true);
  };

  const handleLinkSeasonChange = (season: string) => {
    setLinkSeason(season);
    const filtered = season ? camps.filter((c) => c.seasonTitle === season) : camps;
    const first = filtered[0];
    setLinkCampId(first?.id || '');
    if (first && !first.allowsHaf && linkType === 'haf') setLinkType('paid');
  };

  const handleLinkCampChange = (campId: string) => {
    setLinkCampId(campId);
    const camp = camps.find((c) => c.id === campId);
    if (camp && !camp.allowsHaf && linkType === 'haf') setLinkType('paid');
  };

  const sendLink = async () => {
    setLinkSending(true);
    const pm = linkType === 'haf' ? 'haf' : linkPaymentMethod;
    const res = await fetch('/api/admin/booking-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campId: linkCampId,
        paymentMethod: pm,
        parentEmail: linkEmail,
        parentPhone: linkPhone,
        sendMethod: linkSendMethod,
      }),
    });
    setLinkSending(false);
    if (res.ok) { setLinkSent(true); loadTokens(); }
    else alert('Failed to send link');
  };

  const resendToken = async (id: string) => {
    await fetch(`/api/admin/booking-links/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resend' }) });
    alert('Link resent');
  };

  const revokeToken = async (id: string) => {
    if (!confirm('Revoke this booking link?')) return;
    await fetch(`/api/admin/booking-links/${id}`, { method: 'DELETE' });
    loadTokens();
  };

  const linkSendValid = (() => {
    if (!linkCampId) return false;
    if (linkSendMethod === 'email') return !!linkEmail;
    if (linkSendMethod === 'sms') return !!linkPhone;
    return !!linkEmail && !!linkPhone;
  })();

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#003439] border-t-transparent rounded-full animate-spin" /></div>;
  }

  const inp = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20";
  const lbl = "block text-xs font-semibold text-[#003439] mb-1";

  const TypeToggle = ({ type, setType: setT, allowsHaf }: { type: 'haf' | 'paid'; setType: (t: 'haf' | 'paid') => void; allowsHaf: boolean }) => (
    <div>
      <label className={lbl}>Booking Type</label>
      <div className={`grid gap-2 ${allowsHaf ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {allowsHaf && (
          <button type="button" onClick={() => setT('haf')} className={`px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${type === 'haf' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-[#05575c]/50 hover:border-gray-300'}`}>
            HAF (Free)
          </button>
        )}
        <button type="button" onClick={() => setT('paid')} className={`px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${type === 'paid' ? 'border-[#003439] bg-[#003439]/5 text-[#003439]' : 'border-gray-200 text-[#05575c]/50 hover:border-gray-300'}`}>
          Paid
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#003439]">Bookings</h1>
          <p className="text-sm text-[#05575c]/60 mt-1">
            {bookings.length} booking(s)
            {filter.season && <> &middot; {filter.season}</>}
            {filter.campId && camps.find((c) => c.id === filter.campId) && (
              <> &middot; {camps.find((c) => c.id === filter.campId)!.locationName}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openSendLink} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-[#003439] hover:bg-gray-50 transition-colors">
            <Send size={14} /> Send Booking Link
          </button>
          <button onClick={openNewBooking} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] transition-colors">
            <Plus size={16} /> New Booking
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-[#003439] hover:bg-gray-50 transition-colors">
            <Download size={16} /> CSV
          </button>
        </div>
      </div>

      {/* Active Booking Links */}
      {tokens.length > 0 && (
        <div className="mb-4">
          <button onClick={() => setShowTokens(!showTokens)} className="flex items-center gap-2 text-xs font-semibold text-[#05575c]/50 hover:text-[#003439] mb-2">
            <Link2 size={14} /> {tokens.filter((t) => !t.used).length} active booking link(s)
            {showTokens ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showTokens && (
            <div className="space-y-1.5 mb-4">
              {tokens.map((t) => (
                <div key={t.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs ${t.used ? 'bg-gray-50 border-gray-100 opacity-50' : 'bg-white border-gray-200'}`}>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-[#003439]">{t.parentEmail || t.parentPhone}</span>
                    {t.sendMethod !== 'email' && t.parentPhone && <span className="ml-1 text-[#05575c]/30">({t.parentPhone})</span>}
                    <span className="mx-2 text-[#05575c]/30">&middot;</span>
                    <span className="text-[#05575c]/50">{t.camp.location?.name || t.camp.name}</span>
                    <span className="mx-2 text-[#05575c]/30">&middot;</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${paymentBadgeClass(t.paymentMethod)}`}>{paymentLabel(t.paymentMethod)}</span>
                    {t.sendMethod !== 'email' && (
                      <span className="ml-1.5 text-[#05575c]/30">
                        {t.sendMethod === 'sms' ? <MessageSquare size={10} className="inline" /> : <><Mail size={10} className="inline" /> + <MessageSquare size={10} className="inline" /></>}
                      </span>
                    )}
                  </div>
                  {t.used ? (
                    <span className="text-emerald-600 font-bold">Used</span>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={() => resendToken(t.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500" title="Resend"><RotateCcw size={14} /></button>
                      <button onClick={() => revokeToken(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Revoke"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05575c]/30" />
          <input type="text" value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20" placeholder="Search by name or email..." />
        </div>
        <select value={filter.type} onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20">
          <option value="">All types</option><option value="haf">HAF</option><option value="paid">Paid</option>
        </select>
        <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20">
          <option value="">All statuses</option><option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option>
        </select>
        <select value={filter.season} onChange={(e) => setFilter((f) => ({ ...f, season: e.target.value }))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20">
          <option value="">All seasons</option>
          {[...new Set(camps.map((c) => c.seasonTitle))].filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.campId} onChange={(e) => setFilter((f) => ({ ...f, campId: e.target.value }))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20">
          <option value="">All locations</option>
          {camps.filter((c) => !filter.season || c.seasonTitle === filter.season).map((c) => <option key={c.id} value={c.id}>{c.locationName} ({c.seasonTitle})</option>)}
        </select>
      </div>

      {/* Booking List */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <p className="text-[#05575c]/50">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button onClick={() => setExpandedId(expandedId === b.id ? null : b.id)} className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {statusIcon(b.status)}
                    <span className="font-semibold text-sm text-[#003439]">{b.parentFirstName} {b.parentLastName}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${b.type === 'haf' ? 'bg-emerald-100 text-emerald-700' : 'bg-pink-100 text-pink-700'}`}>{b.type}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{b.status}</span>
                    {b.paymentMethod && b.paymentMethod !== 'stripe' && b.paymentMethod !== 'haf' && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${paymentBadgeClass(b.paymentMethod)}`}>{paymentLabel(b.paymentMethod)}</span>
                    )}
                  </div>
                  <p className="text-xs text-[#05575c]/40 mt-0.5">{b.camp.season?.title && <>{b.camp.season.title} &middot; </>}{b.camp.location?.name || b.camp.name} &middot; {b.children.length} child(ren) &middot; {new Date(b.createdAt).toLocaleDateString('en-GB')}</p>
                </div>
                <span className="text-sm font-semibold text-[#003439]">{b.type === 'paid' ? `£${b.totalAmount}` : 'Free'}</span>
                {expandedId === b.id ? <ChevronUp size={16} className="text-[#05575c]/30" /> : <ChevronDown size={16} className="text-[#05575c]/30" />}
              </button>

              {expandedId === b.id && (
                <div className="px-5 pb-4 border-t border-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 text-xs">
                    <div><span className="text-[#05575c]/40">Email</span><p className="font-medium text-[#003439]">{b.parentEmail}</p></div>
                    <div><span className="text-[#05575c]/40">Phone</span><p className="font-medium text-[#003439]">{b.parentPhone}</p></div>
                    <div><span className="text-[#05575c]/40">Address</span><p className="font-medium text-[#003439]">{b.address}, {b.postcode}</p></div>
                    <div><span className="text-[#05575c]/40">Payment</span><p className="font-medium text-[#003439]">{paymentLabel(b.paymentMethod || 'stripe')}</p></div>
                    {b.hafCode && <div><span className="text-[#05575c]/40">HAF Code</span><p className="font-medium text-[#003439]">{b.hafCode}</p></div>}
                  </div>
                  <div className="space-y-2 mt-2">
                    {b.children.map((child) => (
                      <div key={child.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-[#003439]">{child.firstName} {child.lastName}</span>
                          <span className="text-xs text-[#05575c]/40">Age {child.age}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          {child.schoolName && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{child.schoolName}</span>}
                          {child.hafCode && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">HAF: {child.hafCode}</span>}
                          {child.hasSEND && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">SEND</span>}
                          {child.hasAllergies && <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600">Allergies: {child.allergyDetails}</span>}
                        </div>
                        {child.dayBookings.length > 0 && (
                          <p className="text-[10px] text-[#05575c]/40 mt-1">Days: {child.dayBookings.map((db) => db.campDay.dayLabel).join(', ')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    {b.status !== 'confirmed' && <button onClick={() => updateStatus(b.id, 'confirmed')} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600">Confirm</button>}
                    {b.status !== 'cancelled' && <button onClick={() => updateStatus(b.id, 'cancelled')} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600">Cancel</button>}
                    {b.status !== 'pending' && <button onClick={() => updateStatus(b.id, 'pending')} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-[#003439] hover:bg-gray-50">Set Pending</button>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══════════ NEW BOOKING MODAL ══════════ */}
      {showNewBooking && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowNewBooking(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#003439] mb-4">New Booking</h2>

            <div className="flex gap-1 mb-5">
              {['Camp & Type', 'Parent', 'Children', 'Days', 'Review'].map((s, i) => (
                <div key={s} className={`flex-1 h-1.5 rounded-full ${i <= newBookingStep ? 'bg-[#003439]' : 'bg-gray-200'}`} />
              ))}
            </div>

            {/* Step 0: Camp & Type */}
            {newBookingStep === 0 && (
              <div className="space-y-3">
                <div>
                  <label className={lbl}>Season</label>
                  <select value={nbSeason} onChange={(e) => handleNbSeasonChange(e.target.value)} className={inp}>
                    <option value="">All seasons</option>
                    {seasonList.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Camp / Location</label>
                  <select value={nbCampId} onChange={(e) => handleNbCampChange(e.target.value)} className={inp}>
                    {nbFilteredCamps.map((c) => <option key={c.id} value={c.id}>{c.locationName}{!nbSeason && ` (${c.seasonTitle})`}</option>)}
                  </select>
                </div>
                <TypeToggle type={nbType} setType={setNbType} allowsHaf={nbCampAllowsHaf} />
                {nbType === 'paid' && (
                  <div>
                    <label className={lbl}>Payment Method</label>
                    <select value={nbPaymentMethod} onChange={(e) => setNbPaymentMethod(e.target.value)} className={inp}>
                      {PAID_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                )}
                {nbType === 'haf' && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                    You&apos;ll enter HAF codes for each child in the next steps.
                  </p>
                )}
              </div>
            )}

            {/* Step 1: Parent */}
            {newBookingStep === 1 && (
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-[#003439] mb-2">Parent / Guardian Details</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>First Name</label><input type="text" value={nbParent.firstName} onChange={(e) => setNbParent((p) => ({ ...p, firstName: e.target.value }))} className={inp} /></div>
                  <div><label className={lbl}>Last Name</label><input type="text" value={nbParent.lastName} onChange={(e) => setNbParent((p) => ({ ...p, lastName: e.target.value }))} className={inp} /></div>
                </div>
                <div><label className={lbl}>Email</label><input type="email" value={nbParent.email} onChange={(e) => setNbParent((p) => ({ ...p, email: e.target.value }))} className={inp} /></div>
                <div><label className={lbl}>Phone</label><input type="text" value={nbParent.phone} onChange={(e) => setNbParent((p) => ({ ...p, phone: e.target.value }))} className={inp} /></div>
                <div><label className={lbl}>Address</label><input type="text" value={nbParent.address} onChange={(e) => setNbParent((p) => ({ ...p, address: e.target.value }))} className={inp} /></div>
                <div><label className={lbl}>Postcode</label><input type="text" value={nbParent.postcode} onChange={(e) => setNbParent((p) => ({ ...p, postcode: e.target.value }))} className={inp} /></div>
              </div>
            )}

            {/* Step 2: Children */}
            {newBookingStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-[#003439] mb-2">Children Details</h2>
                {nbChildren.map((child, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#003439]">Child {i + 1}</span>
                      {nbChildren.length > 1 && <button onClick={() => setNbChildren((c) => c.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><XIcon size={14} /></button>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className={lbl}>First Name</label><input type="text" value={child.firstName} onChange={(e) => updateNbChild(i, 'firstName', e.target.value)} className={inp} /></div>
                      <div><label className={lbl}>Last Name</label><input type="text" value={child.lastName} onChange={(e) => updateNbChild(i, 'lastName', e.target.value)} className={inp} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className={lbl}>Date of Birth</label><input type="date" value={child.dateOfBirth} onChange={(e) => updateNbChild(i, 'dateOfBirth', e.target.value)} className={inp} /></div>
                      <div><label className={lbl}>Age</label><input type="number" value={child.age} onChange={(e) => updateNbChild(i, 'age', e.target.value)} className={inp} /></div>
                    </div>
                    {nbType === 'haf' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className={lbl}>School</label><input type="text" value={child.schoolName} onChange={(e) => updateNbChild(i, 'schoolName', e.target.value)} className={inp} /></div>
                        <div><label className={lbl}>HAF Code</label><input type="text" value={child.hafCode} onChange={(e) => updateNbChild(i, 'hafCode', e.target.value)} className={inp} /></div>
                      </div>
                    )}
                    <div className="flex gap-4 text-xs">
                      <label className="flex items-center gap-1.5"><input type="checkbox" checked={child.hasSEND} onChange={(e) => updateNbChild(i, 'hasSEND', e.target.checked)} /> SEND</label>
                      <label className="flex items-center gap-1.5"><input type="checkbox" checked={child.hasAllergies} onChange={(e) => updateNbChild(i, 'hasAllergies', e.target.checked)} /> Allergies</label>
                      <label className="flex items-center gap-1.5"><input type="checkbox" checked={child.photoPermission} onChange={(e) => updateNbChild(i, 'photoPermission', e.target.checked)} /> Photo OK</label>
                    </div>
                    {child.hasAllergies && <div><label className={lbl}>Allergy Details</label><input type="text" value={child.allergyDetails} onChange={(e) => updateNbChild(i, 'allergyDetails', e.target.value)} className={inp} /></div>}
                  </div>
                ))}
                <button onClick={() => setNbChildren((c) => [...c, { ...EMPTY_CHILD }])} className="w-full py-2 rounded-xl border border-dashed border-gray-300 text-xs font-semibold text-[#05575c]/50 hover:border-[#003439] hover:text-[#003439]">
                  + Add Another Child
                </button>
              </div>
            )}

            {/* Step 3: Days */}
            {newBookingStep === 3 && nbCamp && (
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-[#003439] mb-2">Select Days</h2>
                {nbWeeks.map((w) => {
                  const weekDays = nbDays.filter((d) => d.weekNumber === w);
                  const allSelected = weekDays.every((d) => nbSelectedDays.includes(d.id));
                  return (
                    <div key={w} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#003439]">Week {w}</span>
                        <button onClick={() => {
                          const ids = weekDays.map((d) => d.id);
                          setNbSelectedDays((prev) => allSelected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]);
                        }} className="text-[10px] font-semibold text-[#05575c]/50 hover:text-[#003439]">
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {weekDays.map((d) => (
                          <label key={d.id} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-all ${nbSelectedDays.includes(d.id) ? 'bg-[#003439] text-white' : 'bg-white border border-gray-200 text-[#003439]'}`}>
                            <input type="checkbox" className="hidden" checked={nbSelectedDays.includes(d.id)} onChange={(e) => setNbSelectedDays((prev) => e.target.checked ? [...prev, d.id] : prev.filter((x) => x !== d.id))} />
                            {d.dayLabel}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 4: Review */}
            {newBookingStep === 4 && (
              <div className="space-y-3 text-sm">
                <h2 className="text-sm font-bold text-[#003439] mb-2">Review Your Booking</h2>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between"><span className="text-[#05575c]/50">Location</span><span className="font-semibold text-[#003439]">{nbCamp?.locationName}</span></div>
                  <div className="flex justify-between"><span className="text-[#05575c]/50">Type</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${nbType === 'haf' ? 'bg-emerald-100 text-emerald-700' : 'bg-pink-100 text-pink-700'}`}>{nbType === 'haf' ? 'HAF (Free)' : 'Paid'}</span></div>
                  {nbType === 'paid' && <div className="flex justify-between"><span className="text-[#05575c]/50">Payment</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${paymentBadgeClass(nbPaymentMethod)}`}>{paymentLabel(nbPaymentMethod)}</span></div>}
                  <div className="flex justify-between"><span className="text-[#05575c]/50">Parent</span><span className="font-semibold text-[#003439]">{nbParent.firstName} {nbParent.lastName}</span></div>
                  <div className="flex justify-between"><span className="text-[#05575c]/50">Email</span><span className="text-[#003439]">{nbParent.email}</span></div>
                  <div className="flex justify-between"><span className="text-[#05575c]/50">Children</span><span className="text-[#003439]">{nbChildren.map((c) => `${c.firstName} ${c.lastName}`).join(', ')}</span></div>
                  <div className="flex justify-between"><span className="text-[#05575c]/50">Days</span><span className="font-semibold text-[#003439]">{nbSelectedDays.length} day(s)</span></div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-5">
              {newBookingStep > 0 ? (
                <button onClick={() => setNewBookingStep((s) => s - 1)} className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-[#003439] hover:bg-gray-50">Back</button>
              ) : <div />}
              {newBookingStep < 4 ? (
                <button onClick={() => setNewBookingStep((s) => s + 1)} disabled={newBookingStep === 0 && !nbCampId} className="px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] disabled:opacity-40">Next</button>
              ) : (
                <button onClick={submitNewBooking} disabled={saving || nbSelectedDays.length === 0} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-40">
                  {saving ? 'Creating...' : 'Create Booking'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ SEND BOOKING LINK MODAL ══════════ */}
      {showSendLink && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowSendLink(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#003439] mb-1">Send Booking Link</h2>
            <p className="text-xs text-[#05575c]/50 mb-4">Send a one-time booking link to a parent.</p>

            {linkSent ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 mx-auto mb-3 bg-emerald-100 rounded-full flex items-center justify-center"><Check size={24} className="text-emerald-600" /></div>
                <p className="font-semibold text-[#003439] mb-1">Link Sent!</p>
                <p className="text-xs text-[#05575c]/50">
                  {linkType === 'haf' ? 'HAF booking' : 'Paid booking'} link sent
                  {linkSendMethod === 'email' && ` to ${linkEmail}`}
                  {linkSendMethod === 'sms' && ` to ${linkPhone}`}
                  {linkSendMethod === 'both' && ` to ${linkEmail} and ${linkPhone}`}
                </p>
                <button onClick={() => setShowSendLink(false)} className="mt-4 px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold">Done</button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className={lbl}>Season</label>
                  <select value={linkSeason} onChange={(e) => handleLinkSeasonChange(e.target.value)} className={inp}>
                    <option value="">All seasons</option>
                    {seasonList.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Camp / Location</label>
                  <select value={linkCampId} onChange={(e) => handleLinkCampChange(e.target.value)} className={inp}>
                    {linkFilteredCamps.map((c) => <option key={c.id} value={c.id}>{c.locationName}{!linkSeason && ` (${c.seasonTitle})`}</option>)}
                  </select>
                </div>
                <TypeToggle type={linkType} setType={setLinkType} allowsHaf={linkCampAllowsHaf} />
                {linkType === 'paid' && (
                  <div>
                    <label className={lbl}>Payment Method</label>
                    <select value={linkPaymentMethod} onChange={(e) => setLinkPaymentMethod(e.target.value)} className={inp}>
                      {PAID_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                )}
                {linkType === 'haf' && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                    The parent will be asked to provide a HAF code for each child when they complete the form.
                  </p>
                )}
                <div>
                  <label className={lbl}>Send Via</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([['email', 'Email', Mail], ['sms', 'SMS', MessageSquare], ['both', 'Both', Send]] as const).map(([val, label, Icon]) => (
                      <button key={val} type="button" onClick={() => setLinkSendMethod(val)} className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold border transition-all ${linkSendMethod === val ? 'border-[#003439] bg-[#003439]/5 text-[#003439]' : 'border-gray-200 text-[#05575c]/40 hover:border-gray-300'}`}>
                        <Icon size={12} /> {label}
                      </button>
                    ))}
                  </div>
                </div>
                {(linkSendMethod === 'email' || linkSendMethod === 'both') && (
                  <div>
                    <label className={lbl}>Parent Email</label>
                    <input type="email" value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} className={inp} placeholder="parent@example.com" />
                  </div>
                )}
                {(linkSendMethod === 'sms' || linkSendMethod === 'both') && (
                  <div>
                    <label className={lbl}>Phone Number</label>
                    <input type="tel" value={linkPhone} onChange={(e) => setLinkPhone(e.target.value)} className={inp} placeholder="+447..." />
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowSendLink(false)} className="px-4 py-2 rounded-xl text-sm text-[#05575c]/60 hover:bg-gray-50">Cancel</button>
                  <button onClick={sendLink} disabled={linkSending || !linkSendValid} className="px-4 py-2 rounded-xl bg-[#003439] text-white text-sm font-semibold hover:bg-[#004a52] disabled:opacity-40">
                    {linkSending ? 'Sending...' : `Send ${linkType === 'haf' ? 'HAF' : 'Paid'} Link`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingsPage() {
  return <Suspense><BookingsPageInner /></Suspense>;
}
