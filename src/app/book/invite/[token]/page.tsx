'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const PAYMENT_LABELS: Record<string, string> = {
  haf: 'HAF (Free)',
  cash: 'Cash', bank_transfer: 'Bank Transfer',
  childcare_voucher: 'Childcare Voucher', childcare_grant: 'Childcare Grant',
  tax_free_childcare: 'Tax Free Childcare',
  no_payment: 'No Payment Required',
};

interface CampDay { id: string; dayLabel: string; date: string; weekNumber: number }
interface InviteData {
  paymentMethod: string;
  parentEmail: string;
  camp: {
    id: string; name: string;
    location: { name: string; address: string } | null;
    campDays: CampDay[];
  };
}

const EMPTY_CHILD = { firstName: '', lastName: '', dateOfBirth: '', age: '', schoolName: '', hafCode: '', hasSEND: false, hasAllergies: false, allergyDetails: '', photoPermission: false };

export default function InviteBookingPage() {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [complete, setComplete] = useState(false);
  const [bookingId, setBookingId] = useState('');

  const [parent, setParent] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', postcode: '' });
  const [children, setChildren] = useState([{ ...EMPTY_CHILD }]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/book/invite/${token}`)
      .then(async (r) => {
        if (!r.ok) { const d = await r.json(); setError(d.error || 'Invalid link'); return; }
        const data: InviteData = await r.json();
        setInvite(data);
        setParent((p) => ({ ...p, email: data.parentEmail }));
      })
      .catch(() => setError('Something went wrong'))
      .finally(() => setLoading(false));
  }, [token]);

  const updateChild = (i: number, key: string, val: unknown) => {
    setChildren((prev) => { const c = [...prev]; c[i] = { ...c[i], [key]: val }; return c; });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch(`/api/book/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parent, parentFirstName: parent.firstName, parentLastName: parent.lastName, parentEmail: parent.email, parentPhone: parent.phone, children, selectedDays }),
      });
      const result = await res.json();
      if (!res.ok) { setSubmitError(result.error || 'Booking failed'); setSubmitting(false); return; }
      setBookingId(result.booking.id);
      setComplete(true);
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f7f7]">
        <div className="w-12 h-12 border-4 border-[#00dcde] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f7f7] p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-[#003439]/5 p-8 max-w-lg w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-[#003439] mb-3">Link Not Valid</h2>
          <p className="text-[#05575c]/70 mb-6">{error}</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#00adb3] to-[#00d4db] hover:from-[#00c4ca] hover:to-[#00e5ec] shadow-md transition-all">
            Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (complete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f7f7] p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-[#003439]/5 p-8 max-w-lg w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-[#00dcde]/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-[#00dcde]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-[#003439] mb-3">Booking Confirmed!</h2>
          <p className="text-[#05575c] mb-2">Thank you, {parent.firstName}! Your booking has been received.</p>
          <p className="text-sm text-[#05575c]/70 mb-6">A confirmation will be sent to <strong>{parent.email}</strong></p>
          <div className="bg-[#f0f7f7] rounded-xl p-4 text-left text-sm space-y-1">
            <p><span className="font-semibold">Booking ID:</span> {bookingId.slice(0, 8).toUpperCase()}</p>
            <p><span className="font-semibold">Location:</span> {invite?.camp.location?.name || invite?.camp.name}</p>
            <p><span className="font-semibold">Payment:</span> {PAYMENT_LABELS[invite?.paymentMethod || ''] || invite?.paymentMethod}</p>
            <p><span className="font-semibold">Days:</span> {selectedDays.length}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!invite) return null;

  const campDays = invite.camp.campDays;
  const weeks = [...new Set(campDays.map((d) => d.weekNumber))].sort((a, b) => a - b);
  const stepLabels = ['Parent', 'Children', 'Days', 'Review'];
  const inp = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003439]/20";
  const lbl = "block text-xs font-semibold text-[#003439] mb-1";

  return (
    <div className="min-h-screen bg-[#f0f7f7]">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#003439] via-[#05575c] to-[#003439] py-10 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,220,222,0.15),transparent_50%)]" />
        <Link href="/" className="absolute top-4 left-4 z-10 flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors group">
          <svg className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <Image src="/logo-brand.png" alt="Robocode" width={80} height={24} className="h-5 w-auto opacity-60 group-hover:opacity-100 transition-opacity" />
        </Link>
        <div className="relative max-w-2xl mx-auto text-center">
          <h1 className="font-[var(--font-display)] text-[clamp(1.8rem,5vw,2.5rem)] leading-[1.1] tracking-tight text-white uppercase">
            <span className="block">Holiday</span>
            <span className="block bg-gradient-to-r from-[#00dcde] via-[#ff00bf] to-[#ff9752] bg-clip-text text-transparent">Tech Camp</span>
          </h1>
          <p className="mt-3 text-sm text-white/60">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs ${invite.paymentMethod === 'haf' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/80'}`}>
              {invite.paymentMethod === 'haf' ? 'HAF Funded — Free Place' : PAYMENT_LABELS[invite.paymentMethod] || invite.paymentMethod}
            </span>
            <span className="ml-2">{invite.camp.location?.name || invite.camp.name}</span>
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress */}
        <div className="flex items-center gap-1 mb-6">
          {stepLabels.map((s, i) => (
            <div key={s} className="flex-1 text-center">
              <div className={`h-1.5 rounded-full mb-1 ${i <= step ? 'bg-[#003439]' : 'bg-gray-200'}`} />
              <span className={`text-[10px] font-semibold ${i <= step ? 'text-[#003439]' : 'text-[#05575c]/30'}`}>{s}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-[#003439]/5 p-6 sm:p-8">
          {/* Step 0: Parent */}
          {step === 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-[#003439] mb-4">Parent / Guardian Details</h2>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>First Name</label><input type="text" value={parent.firstName} onChange={(e) => setParent((p) => ({ ...p, firstName: e.target.value }))} className={inp} /></div>
                <div><label className={lbl}>Last Name</label><input type="text" value={parent.lastName} onChange={(e) => setParent((p) => ({ ...p, lastName: e.target.value }))} className={inp} /></div>
              </div>
              <div><label className={lbl}>Email</label><input type="email" value={parent.email} onChange={(e) => setParent((p) => ({ ...p, email: e.target.value }))} className={inp} /></div>
              <div><label className={lbl}>Phone</label><input type="text" value={parent.phone} onChange={(e) => setParent((p) => ({ ...p, phone: e.target.value }))} className={inp} /></div>
              <div><label className={lbl}>Address</label><input type="text" value={parent.address} onChange={(e) => setParent((p) => ({ ...p, address: e.target.value }))} className={inp} /></div>
              <div><label className={lbl}>Postcode</label><input type="text" value={parent.postcode} onChange={(e) => setParent((p) => ({ ...p, postcode: e.target.value }))} className={inp} /></div>
            </div>
          )}

          {/* Step 1: Children */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#003439] mb-4">Children Details</h2>
              {children.map((child, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#003439]">Child {i + 1}</span>
                    {children.length > 1 && <button onClick={() => setChildren((c) => c.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className={lbl}>First Name</label><input type="text" value={child.firstName} onChange={(e) => updateChild(i, 'firstName', e.target.value)} className={inp} /></div>
                    <div><label className={lbl}>Last Name</label><input type="text" value={child.lastName} onChange={(e) => updateChild(i, 'lastName', e.target.value)} className={inp} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className={lbl}>Date of Birth</label><input type="date" value={child.dateOfBirth} onChange={(e) => updateChild(i, 'dateOfBirth', e.target.value)} className={inp} /></div>
                    <div><label className={lbl}>Age</label><input type="number" value={child.age} onChange={(e) => updateChild(i, 'age', e.target.value)} className={inp} /></div>
                  </div>
                  {invite.paymentMethod === 'haf' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className={lbl}>School Name</label><input type="text" value={child.schoolName} onChange={(e) => updateChild(i, 'schoolName', e.target.value)} className={inp} placeholder="Child's school" /></div>
                      <div><label className={lbl}>HAF Code</label><input type="text" value={child.hafCode} onChange={(e) => updateChild(i, 'hafCode', e.target.value)} className={inp} placeholder="e.g. HAF-XXXX" /></div>
                    </div>
                  )}
                  <div className="flex gap-4 text-xs">
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={child.hasSEND} onChange={(e) => updateChild(i, 'hasSEND', e.target.checked)} /> SEND</label>
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={child.hasAllergies} onChange={(e) => updateChild(i, 'hasAllergies', e.target.checked)} /> Allergies</label>
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={child.photoPermission} onChange={(e) => updateChild(i, 'photoPermission', e.target.checked)} /> Photo OK</label>
                  </div>
                  {child.hasAllergies && <div><label className={lbl}>Allergy Details</label><input type="text" value={child.allergyDetails} onChange={(e) => updateChild(i, 'allergyDetails', e.target.value)} className={inp} /></div>}
                </div>
              ))}
              <button onClick={() => setChildren((c) => [...c, { ...EMPTY_CHILD }])} className="w-full py-2 rounded-xl border border-dashed border-gray-300 text-xs font-semibold text-[#05575c]/50 hover:border-[#003439] hover:text-[#003439]">
                + Add Another Child
              </button>
            </div>
          )}

          {/* Step 2: Days */}
          {step === 2 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-[#003439] mb-4">Select Days</h2>
              {weeks.map((w) => {
                const weekDays = campDays.filter((d) => d.weekNumber === w);
                const allSelected = weekDays.every((d) => selectedDays.includes(d.id));
                return (
                  <div key={w} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#003439]">Week {w}</span>
                      <button onClick={() => {
                        const ids = weekDays.map((d) => d.id);
                        setSelectedDays((prev) => allSelected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]);
                      }} className="text-[10px] font-semibold text-[#05575c]/50 hover:text-[#003439]">
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {weekDays.map((d) => (
                        <label key={d.id} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-all ${selectedDays.includes(d.id) ? 'bg-[#003439] text-white' : 'bg-white border border-gray-200 text-[#003439]'}`}>
                          <input type="checkbox" className="hidden" checked={selectedDays.includes(d.id)} onChange={(e) => setSelectedDays((prev) => e.target.checked ? [...prev, d.id] : prev.filter((x) => x !== d.id))} />
                          {d.dayLabel}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-[#003439] mb-4">Review Your Booking</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#05575c]/50">Location</span><span className="font-semibold text-[#003439]">{invite.camp.location?.name || invite.camp.name}</span></div>
                <div className="flex justify-between"><span className="text-[#05575c]/50">Payment</span><span className="font-semibold text-[#003439]">{PAYMENT_LABELS[invite.paymentMethod] || invite.paymentMethod}</span></div>
                <div className="flex justify-between"><span className="text-[#05575c]/50">Parent</span><span className="font-semibold text-[#003439]">{parent.firstName} {parent.lastName}</span></div>
                <div className="flex justify-between"><span className="text-[#05575c]/50">Email</span><span className="text-[#003439]">{parent.email}</span></div>
                <div className="flex justify-between"><span className="text-[#05575c]/50">Phone</span><span className="text-[#003439]">{parent.phone}</span></div>
                <div className="flex justify-between"><span className="text-[#05575c]/50">Children</span><span className="text-[#003439]">{children.map((c) => `${c.firstName} ${c.lastName}`).join(', ')}</span></div>
                <div className="flex justify-between"><span className="text-[#05575c]/50">Days</span><span className="font-semibold text-[#003439]">{selectedDays.length} day(s)</span></div>
              </div>
            </div>
          )}

          {submitError && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{submitError}</div>}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button onClick={() => setStep((s) => s - 1)} className="px-6 py-3 rounded-xl font-semibold border-2 border-[#003439] text-[#003439] hover:bg-[#003439]/5 transition-colors">Back</button>
            ) : <div />}
            {step < 3 ? (
              <button onClick={() => setStep((s) => s + 1)} className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#00adb3] to-[#00d4db] hover:from-[#00c4ca] hover:to-[#00e5ec] shadow-md transition-all">Continue</button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting || selectedDays.length === 0} className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md transition-all disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Booking'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
