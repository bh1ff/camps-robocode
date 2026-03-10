'use client';

import { useState, useEffect } from 'react';
import ProgressBar from '@/components/ui/ProgressBar';
import StepLocation from './StepLocation';
import StepParent from './StepParent';
import StepChildren from './StepChildren';
import StepDays from './StepDays';
import StepReview from './StepReview';
import { calculateBookingTotal, formatPriceWhole } from '@/lib/pricing';

export interface LocationData {
  id: string;
  name: string;
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
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  address: string;
  postcode: string;
  hafCode: string;
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
  hasSEND: false,
  hasEHCP: false,
  ehcpDetails: '',
  hasAllergies: false,
  allergyDetails: '',
  photoPermission: false,
};

interface BookingWizardProps {
  bookingType: 'haf' | 'paid';
}

export default function BookingWizard({ bookingType }: BookingWizardProps) {
  const [step, setStep] = useState(0);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<BookingFormState>({
    locationId: '',
    campId: '',
    parentFirstName: '',
    parentLastName: '',
    parentEmail: '',
    parentPhone: '',
    address: '',
    postcode: '',
    hafCode: '',
    numberOfChildren: 1,
    children: [{ ...EMPTY_CHILD }],
    selectedDays: [],
  });

  useEffect(() => {
    fetch('/api/locations')
      .then((res) => res.json())
      .then((data) => {
        let filtered = data;
        if (bookingType === 'paid') {
          filtered = data.filter((l: LocationData) => l.allowsPaid);
        }
        setLocations(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bookingType]);

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

  const stepLabels = bookingType === 'haf'
    ? ['Location', 'Parent', 'Children', 'Days', 'Review']
    : ['Location', 'Parent', 'Children', 'Days', 'Review & Pay'];

  const totalSteps = stepLabels.length;

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!form.campId) newErrors.campId = 'Please select a location';
    }

    if (step === 1) {
      if (!form.parentFirstName.trim()) newErrors.parentFirstName = 'Required';
      if (!form.parentLastName.trim()) newErrors.parentLastName = 'Required';
      if (!form.parentEmail.trim() || !form.parentEmail.includes('@'))
        newErrors.parentEmail = 'Valid email required';
      if (!form.parentPhone.trim()) newErrors.parentPhone = 'Required';
      if (!form.address.trim()) newErrors.address = 'Required';
      if (!form.postcode.trim()) newErrors.postcode = 'Required';
      if (bookingType === 'haf' && !form.hafCode.trim())
        newErrors.hafCode = 'HAF code required';
    }

    if (step === 2) {
      form.children.forEach((child, i) => {
        if (!child.firstName.trim()) newErrors[`child${i}_firstName`] = 'Required';
        if (!child.lastName.trim()) newErrors[`child${i}_lastName`] = 'Required';
        if (!child.dateOfBirth) newErrors[`child${i}_dateOfBirth`] = 'Required';
        if (!child.age || isNaN(Number(child.age))) newErrors[`child${i}_age`] = 'Required';
        if (!child.schoolName.trim()) newErrors[`child${i}_schoolName`] = 'Required';
        if (!child.schoolYear.trim()) newErrors[`child${i}_schoolYear`] = 'Required';
      });
    }

    if (step === 3) {
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

  const pricingInfo = bookingType === 'paid'
    ? calculateBookingTotal(form.children.map(() => form.selectedDays.length))
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
        ...(bookingType === 'haf' ? { hafCode: form.hafCode } : {}),
        totalAmount: pricingInfo ? pricingInfo.totalPence / 100 : 0,
        children: form.children.map((c) => ({
          firstName: c.firstName,
          lastName: c.lastName,
          dateOfBirth: c.dateOfBirth,
          age: Number(c.age),
          schoolName: c.schoolName,
          schoolYear: c.schoolYear,
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
        setSubmitError(result.error || 'Booking failed');
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
        <div className="robo-card p-8 max-w-lg w-full text-center">
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
      <div className="robo-gradient py-6 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-heading text-white mb-1">
            ROBOCODE HOLIDAY TECH CAMP
          </h1>
          <p className="text-[#83fdff] text-sm">
            {bookingType === 'haf' ? 'HAF Funded Booking' : 'Book Your Spot'}
            {' '}&bull; Easter 2026
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <ProgressBar currentStep={step} totalSteps={totalSteps} labels={stepLabels} />

        <div className="robo-card p-6 sm:p-8">
          {step === 0 && (
            <StepLocation
              locations={locations}
              form={form}
              updateForm={updateForm}
              errors={errors}
              bookingType={bookingType}
            />
          )}

          {step === 1 && (
            <StepParent
              form={form}
              updateForm={updateForm}
              errors={errors}
              bookingType={bookingType}
            />
          )}

          {step === 2 && (
            <StepChildren
              form={form}
              updateChild={updateChild}
              setChildCount={setChildCount}
              errors={errors}
            />
          )}

          {step === 3 && selectedCamp && (
            <StepDays
              campDays={selectedCamp.campDays}
              selectedDays={form.selectedDays}
              onChange={(days) => updateForm({ selectedDays: days })}
              errors={errors}
              bookingType={bookingType}
              childCount={form.numberOfChildren}
            />
          )}

          {step === 4 && (
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
                className="robo-btn px-8 py-3 rounded-xl font-semibold"
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
        </div>

        {bookingType === 'paid' && form.selectedDays.length > 0 && step >= 3 && pricingInfo && (
          <div className="mt-4 robo-card p-4 bg-gradient-to-r from-[#fff0fd] to-[#fff6ed]">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[#003439]">Total</span>
              <span className="text-xl font-heading text-[#ff00bf]">
                {formatPriceWhole(pricingInfo.totalPence)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
