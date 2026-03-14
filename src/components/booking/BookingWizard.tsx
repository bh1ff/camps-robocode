'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ProgressBar from '@/components/ui/ProgressBar';
import StepHafGate from './StepHafGate';
import StepLocation from './StepLocation';
import StepParent from './StepParent';
import StepChildren from './StepChildren';
import StepDays from './StepDays';
import StepReview from './StepReview';
import { calculateBookingTotalWithTiers, formatPriceWhole, type PriceTierData } from '@/lib/pricing';

export interface LocationData {
  id: string;
  name: string;
  slug: string;
  address: string;
  region: string;
  capacityPerDay: number;
  hafSeatsTotal: number;
  allowsPaid: boolean;
  camps: {
    id: string;
    name: string;
    campDays: { id: string; date: string; dayLabel: string; weekNumber: number }[];
  }[];
}

export interface ChildFormState {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: string;
  schoolName: string;
  schoolYear: string;
  hafCode: string;
  fsmEligible: boolean;
  ethnicity: string;
  gender: string;
  hasSEND: boolean;
  hasEHCP: boolean;
  ehcpDetails: string;
  hasAllergies: boolean;
  allergyDetails: string;
  photoPermission: boolean;
}

export interface BookingFormState {
  locationId: string;
  campId: string;
  selectedVariant: 'haf' | 'paid' | '';
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  address: string;
  postcode: string;
  numberOfChildren: number;
  children: ChildFormState[];
  selectedDays: string[];
}

const EMPTY_CHILD: ChildFormState = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  age: '',
  schoolName: '',
  schoolYear: '',
  hafCode: '',
  fsmEligible: true,
  ethnicity: '',
  gender: '',
  hasSEND: false,
  hasEHCP: false,
  ehcpDetails: '',
  hasAllergies: false,
  allergyDetails: '',
  photoPermission: false,
};

const SLUG_NAME_MAP: Record<string, string> = {
  'shirley': 'robocode shirley',
  'kingshurst': 'kingshurst',
  'bcu': 'birmingham city',
};

interface BookingWizardProps {
  bookingType: 'haf' | 'paid';
}

export default function BookingWizard({ bookingType }: BookingWizardProps) {
  const searchParams = useSearchParams();
  const preselectedSlug = searchParams.get('location') || '';

  const [step, setStep] = useState(0);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gateRegion, setGateRegion] = useState('');
  const [showChangeOptions, setShowChangeOptions] = useState(false);
  const [priceTiers, setPriceTiers] = useState<PriceTierData[]>([]);
  const router = useRouter();

  const [form, setForm] = useState<BookingFormState>({
    locationId: '',
    campId: '',
    selectedVariant: '',
    parentFirstName: '',
    parentLastName: '',
    parentEmail: '',
    parentPhone: '',
    address: '',
    postcode: '',
    numberOfChildren: 1,
    children: [{ ...EMPTY_CHILD }],
    selectedDays: [],
  });

  useEffect(() => {
    fetch('/api/pricing')
      .then((r) => r.json())
      .then((tiers: PriceTierData[]) => {
        if (Array.isArray(tiers) && tiers.length > 0) setPriceTiers(tiers);
      })
      .catch(() => {});

    fetch('/api/locations')
      .then((res) => res.json())
      .then((data) => {
        setLocations(data);

        if (preselectedSlug) {
          const nameHint = SLUG_NAME_MAP[preselectedSlug] || preselectedSlug;
          const match = data.find((l: LocationData) =>
            l.slug === preselectedSlug || l.name.toLowerCase().includes(nameHint)
          );
          if (match && match.camps.length > 0) {
            setForm((prev) => ({
              ...prev,
              locationId: match.id,
              campId: match.camps[0].id,
              selectedVariant: bookingType,
            }));
            setGateRegion(match.region);
          }
        }

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bookingType, preselectedSlug]);

  const updateForm = (updates: Partial<BookingFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    setErrors({});
    setSubmitError('');
  };

  const updateChild = (index: number, updates: Partial<ChildFormState>) => {
    setForm((prev) => {
      const children = [...prev.children];
      children[index] = { ...children[index], ...updates };
      return { ...prev, children };
    });
    setErrors({});
  };

  const setChildCount = (count: number) => {
    const children = [...form.children];
    while (children.length < count) children.push({ ...EMPTY_CHILD });
    while (children.length > count) children.pop();
    updateForm({ numberOfChildren: count, children });
  };

  const isHaf = bookingType === 'haf';

  const stepLabels = isHaf
    ? ['HAF Code', 'Location', 'Children', 'Parent', 'Days', 'Review']
    : ['Location', 'Children', 'Parent', 'Days', 'Review & Pay'];

  const totalSteps = stepLabels.length;

  const STEP = isHaf
    ? { GATE: 0, LOCATION: 1, CHILDREN: 2, PARENT: 3, DAYS: 4, REVIEW: 5 }
    : { LOCATION: 0, CHILDREN: 1, PARENT: 2, DAYS: 3, REVIEW: 4 };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === STEP.LOCATION) {
      if (!form.campId) newErrors.campId = 'Please select a location';
    }

    if (step === STEP.PARENT) {
      if (!form.parentFirstName.trim()) newErrors.parentFirstName = 'Required';
      if (!form.parentLastName.trim()) newErrors.parentLastName = 'Required';
      if (!form.parentEmail.trim() || !form.parentEmail.includes('@'))
        newErrors.parentEmail = 'Valid email required';
      if (!form.parentPhone.trim()) newErrors.parentPhone = 'Required';
      else if (form.parentPhone.trim().length < 5) newErrors.parentPhone = 'Enter a valid phone number';
      if (!form.address.trim()) newErrors.address = 'Required';
      else if (form.address.trim().length < 3) newErrors.address = 'Address too short';
      if (!form.postcode.trim()) newErrors.postcode = 'Required';
      else if (form.postcode.trim().length < 3) newErrors.postcode = 'Enter a valid postcode';
    }

    if (step === STEP.CHILDREN) {
      form.children.forEach((child, i) => {
        if (!child.firstName.trim()) newErrors[`child${i}_firstName`] = 'Required';
        if (!child.lastName.trim()) newErrors[`child${i}_lastName`] = 'Required';
        if (!child.dateOfBirth) newErrors[`child${i}_dateOfBirth`] = 'Required';
        if (!child.age || isNaN(Number(child.age))) newErrors[`child${i}_age`] = 'Required';
        if (isHaf) {
          const sn = child.schoolName.trim();
          if (!sn || sn === "My child's school is not listed") newErrors[`child${i}_schoolName`] = 'Please type the school name';
          if (!child.schoolYear.trim()) newErrors[`child${i}_schoolYear`] = 'Required';
          if (!child.hafCode.trim()) newErrors[`child${i}_hafCode`] = 'HAF code required';
          if (selectedRegion === 'birmingham') {
            if (!child.ethnicity.trim()) newErrors[`child${i}_ethnicity`] = 'Required';
            if (!child.gender.trim()) newErrors[`child${i}_gender`] = 'Required';
          }
        }
      });
    }

    if (step === STEP.DAYS) {
      if (form.selectedDays.length === 0) newErrors.selectedDays = 'Select at least one day';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const selectedLocation = locations.find((l) => l.id === form.locationId);
  const selectedCamp = selectedLocation?.camps.find((c) => c.id === form.campId);
  const selectedRegion = selectedLocation?.region || '';

  const pricingInfo = bookingType === 'paid' && priceTiers.length > 0
    ? calculateBookingTotalWithTiers(form.children.map(() => form.selectedDays.length), priceTiers)
    : null;

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        type: bookingType,
        campId: form.campId,
        parentFirstName: form.parentFirstName,
        parentLastName: form.parentLastName,
        parentEmail: form.parentEmail,
        parentPhone: form.parentPhone,
        address: form.address,
        postcode: form.postcode,
        totalAmount: pricingInfo ? pricingInfo.totalPence / 100 : 0,
        children: form.children.map((c) => ({
          firstName: c.firstName,
          lastName: c.lastName,
          dateOfBirth: c.dateOfBirth,
          age: Number(c.age),
          schoolName: isHaf ? c.schoolName : undefined,
          schoolYear: isHaf ? c.schoolYear : undefined,
          hafCode: isHaf ? c.hafCode : undefined,
          fsmEligible: isHaf ? c.fsmEligible : undefined,
          ethnicity: isHaf ? (c.ethnicity || undefined) : undefined,
          gender: isHaf ? (c.gender || undefined) : undefined,
          hasSEND: c.hasSEND,
          hasEHCP: c.hasEHCP,
          ehcpDetails: c.ehcpDetails || undefined,
          hasAllergies: c.hasAllergies,
          allergyDetails: c.allergyDetails || undefined,
          photoPermission: c.photoPermission,
        })),
        selectedDays: form.selectedDays,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        let msg = result.error || 'Booking failed';
        if (result.details?.fieldErrors) {
          const fields = Object.entries(result.details.fieldErrors)
            .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
            .join('; ');
          if (fields) msg += ` — ${fields}`;
        }
        setSubmitError(msg);
        setSubmitting(false);
        return;
      }

      if (bookingType === 'paid') {
        const payRes = await fetch('/api/payments/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: result.booking.id }),
        });
        const payResult = await payRes.json();
        if (payResult.url) {
          window.location.href = payResult.url;
          return;
        }
        setSubmitError('Payment session failed');
        setSubmitting(false);
        return;
      }

      setBookingId(result.booking.id);
      setBookingComplete(true);
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

  if (bookingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f7f7] p-4">
        <div className="bg-white rounded-2xl shadow-lg shadow-[#003439]/5 border border-[#003439]/5 p-8 max-w-lg w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-[#00dcde]/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-[#00dcde]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-heading text-[#003439] mb-3">BOOKING CONFIRMED</h2>
          <p className="text-[#05575c] mb-2">
            Thank you, {form.parentFirstName}! Your booking has been received.
          </p>
          <p className="text-sm text-[#05575c]/70 mb-6">
            A confirmation will be sent to <strong>{form.parentEmail}</strong>
          </p>
          <div className="bg-[#f0f7f7] rounded-xl p-4 text-left text-sm space-y-1">
            <p><span className="font-semibold">Booking ID:</span> {bookingId.slice(0, 8).toUpperCase()}</p>
            <p><span className="font-semibold">Location:</span> {selectedLocation?.name}</p>
            <p><span className="font-semibold">Children:</span> {form.children.map(c => `${c.firstName} ${c.lastName}`).join(', ')}</p>
            <p><span className="font-semibold">Days:</span> {form.selectedDays.length} day{form.selectedDays.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f7f7]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#003439] via-[#05575c] to-[#003439] py-10 sm:py-14 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,220,222,0.15),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,0,191,0.1),transparent_50%)]" />
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-[0.04]">
          <div className="absolute -top-10 -left-10 w-40 h-40 border-2 border-white rounded-full" />
          <div className="absolute top-6 right-10 w-24 h-24 border-2 border-white rounded-full" />
          <div className="absolute bottom-2 left-1/3 w-16 h-16 border-2 border-white rounded-full" />
        </div>

        <Link href="/" className="absolute top-4 left-4 z-10 flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors group">
          <svg className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <Image src="/logo-brand.png" alt="Robocode" width={80} height={24} className="h-5 w-auto opacity-60 group-hover:opacity-100 transition-opacity" />
        </Link>

        <div className="relative max-w-2xl mx-auto text-center">
          <h1 className="font-[var(--font-display)] text-[clamp(1.8rem,5vw,3rem)] leading-[1.1] tracking-tight text-white uppercase">
            <span className="block">Holiday</span>
            <span className="block bg-gradient-to-r from-[#00dcde] via-[#ff00bf] to-[#ff9752] bg-clip-text text-transparent">Tech Camp</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base font-[var(--font-body)] tracking-wide uppercase">
            {isHaf ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs mr-2">HAF Funded</span>
                <span className="text-white/60">Free places available</span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff00bf]/20 text-[#ff58ea] font-bold text-xs mr-2">Paid Camp</span>
                <span className="text-white/60">Book your spot</span>
              </>
            )}
            <span className="text-[#00dcde] ml-2 font-bold">Easter 2026</span>
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <ProgressBar currentStep={step} totalSteps={totalSteps} labels={stepLabels} />

        {selectedLocation && step > STEP.LOCATION && (
          <div className="mb-4 px-1">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#003439]">{selectedLocation.name}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                isHaf
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-[#fff0fd] text-[#ff00bf]'
              }`}>
                {isHaf ? 'HAF Free' : 'Paid Camp'}
              </span>
              <button
                type="button"
                onClick={() => setShowChangeOptions((v) => !v)}
                className="ml-auto text-[11px] text-[#05575c]/30 hover:text-[#05575c]/60 transition-colors"
              >
                Change
              </button>
            </div>

            {showChangeOptions && (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateForm({ locationId: '', campId: '', selectedVariant: '', selectedDays: [] });
                    setShowChangeOptions(false);
                    setStep(STEP.LOCATION);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-[#003439] hover:bg-gray-50 transition-colors"
                >
                  Change location
                </button>
                <button
                  type="button"
                  onClick={() => {
                    router.push(isHaf ? '/book/paid' : '/book/haf');
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                    isHaf
                      ? 'border-[#ff00bf]/20 text-[#ff00bf] hover:bg-[#fff5fc]'
                      : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {isHaf ? 'Switch to paid camp' : 'Switch to free (HAF)'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg shadow-[#003439]/5 border border-[#003439]/5 p-6 sm:p-8">
          {isHaf && step === STEP.GATE && (
            <StepHafGate
              onConfirm={(region) => {
                setGateRegion(region);
                handleNext();
              }}
            />
          )}

          {step === STEP.LOCATION && (
            <StepLocation
              locations={locations}
              form={form}
              updateForm={updateForm}
              errors={errors}
              bookingType={bookingType}
              initialRegion={gateRegion}
            />
          )}

          {step === STEP.CHILDREN && (
            <StepChildren
              form={form}
              updateChild={updateChild}
              setChildCount={setChildCount}
              errors={errors}
              bookingType={bookingType}
              locationRegion={selectedRegion}
            />
          )}

          {step === STEP.PARENT && (
            <StepParent
              form={form}
              updateForm={updateForm}
              errors={errors}
              bookingType={bookingType}
            />
          )}

          {step === STEP.DAYS && selectedCamp && (
            <StepDays
              campDays={selectedCamp.campDays}
              selectedDays={form.selectedDays}
              onChange={(days) => updateForm({ selectedDays: days })}
              errors={errors}
              bookingType={bookingType}
              childCount={form.numberOfChildren}
              priceTiers={priceTiers}
            />
          )}

          {step === STEP.REVIEW && (
            <StepReview
              form={form}
              locationName={selectedLocation?.name || ''}
              campDays={selectedCamp?.campDays || []}
              bookingType={bookingType}
              pricingInfo={pricingInfo}
            />
          )}

          {submitError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {submitError}
            </div>
          )}

          {!(isHaf && step === STEP.GATE) && (
            <div className="flex justify-between mt-8">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 rounded-xl font-semibold border-2 border-[#003439] text-[#003439] hover:bg-[#003439]/5 transition-colors"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#00adb3] to-[#00d4db] hover:from-[#00c4ca] hover:to-[#00e5ec] shadow-md shadow-[#00adb3]/20 transition-all"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
                  style={{
                    background: bookingType === 'paid'
                      ? 'linear-gradient(135deg, #ff00bf 0%, #ff58ea 100%)'
                      : 'linear-gradient(135deg, #00adb3 0%, #00d4db 100%)',
                  }}
                >
                  {submitting
                    ? 'Processing...'
                    : bookingType === 'paid'
                    ? `Pay ${pricingInfo ? formatPriceWhole(pricingInfo.totalPence) : ''}`
                    : 'Submit Booking'}
                </button>
              )}
            </div>
          )}
        </div>

        {bookingType === 'paid' && form.selectedDays.length > 0 && step >= STEP.DAYS && pricingInfo && (
          <div className="mt-4 bg-white rounded-2xl shadow-lg shadow-[#003439]/5 border border-[#003439]/5 p-4 bg-gradient-to-r from-[#fff0fd] to-[#fff6ed]">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[#003439]">Total</span>
              <span className="text-xl font-heading text-[#ff00bf]">
                {formatPriceWhole(pricingInfo.totalPence)}
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href={bookingType === 'paid' ? '/book/haf' : '/book/paid'}
            className="text-xs text-[#05575c]/30 hover:text-[#05575c]/50 transition-colors"
          >
            {bookingType === 'paid' ? 'Book a free camp instead (HAF)' : 'Book a paid camp instead'}
          </Link>
        </div>
      </div>
    </div>
  );
}
