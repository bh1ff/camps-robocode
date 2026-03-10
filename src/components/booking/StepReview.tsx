'use client';

import { BookingFormState } from './BookingWizard';
import { formatPriceWhole } from '@/lib/pricing';

interface CampDay {
  id: string;
  dayLabel: string;
  weekNumber: number;
}

interface Props {
  form: BookingFormState;
  locationName: string;
  campDays: CampDay[];
  bookingType: 'haf' | 'paid';
  pricingInfo: { totalPence: number; perChild: { days: number; pence: number }[] } | null;
}

export default function StepReview({ form, locationName, campDays, bookingType, pricingInfo }: Props) {
  const selectedDayLabels = campDays
    .filter((d) => form.selectedDays.includes(d.id))
    .sort((a, b) => new Date(a.dayLabel).getTime() - new Date(b.dayLabel).getTime());

  const week1Days = selectedDayLabels.filter((d) => d.weekNumber === 1);
  const week2Days = selectedDayLabels.filter((d) => d.weekNumber === 2);

  return (
    <div>
      <h2 className="text-xl font-heading text-[#003439] mb-2">REVIEW YOUR BOOKING</h2>
      <p className="text-sm text-[#05575c]/70 mb-6">
        Please check all details before {bookingType === 'paid' ? 'proceeding to payment' : 'submitting'}.
      </p>

      <div className="space-y-4">
        <Section title="Location">
          <p className="font-medium">{locationName}</p>
        </Section>

        <Section title="Parent / Guardian">
          <p className="font-medium">{form.parentFirstName} {form.parentLastName}</p>
          <p className="text-sm text-[#05575c]/70">{form.parentEmail}</p>
          <p className="text-sm text-[#05575c]/70">{form.parentPhone}</p>
          <p className="text-sm text-[#05575c]/70">{form.address}, {form.postcode}</p>
          {bookingType === 'haf' && (
            <p className="text-sm mt-1"><span className="font-medium">HAF Code:</span> {form.hafCode}</p>
          )}
        </Section>

        <Section title={`${form.children.length > 1 ? 'Children' : 'Child'} (${form.children.length})`}>
          {form.children.map((child, i) => (
            <div key={i} className={`${i > 0 ? 'border-t border-gray-100 pt-3 mt-3' : ''}`}>
              <p className="font-medium">{child.firstName} {child.lastName}</p>
              <div className="grid grid-cols-2 gap-x-4 text-sm text-[#05575c]/70 mt-1">
                <p>Age: {child.age}</p>
                <p>DOB: {child.dateOfBirth}</p>
                <p>School: {child.schoolName || '—'}</p>
                <p>Year: {child.schoolYear || '—'}</p>
                <p>SEND: {child.hasSEND ? 'Yes' : 'No'}</p>
                {child.hasEHCP && <p>EHCP: Yes</p>}
                <p>Allergies: {child.hasAllergies ? child.allergyDetails : 'None'}</p>
                <p>Photo permission: {child.photoPermission ? 'Yes' : 'No'}</p>
              </div>
            </div>
          ))}
        </Section>

        <Section title="Selected Days">
          <div className="space-y-2">
            {week1Days.length > 0 && (
              <div>
                <p className="text-xs font-heading text-[#05575c]/50 mb-1">WEEK 1</p>
                <div className="flex flex-wrap gap-2">
                  {week1Days.map((d) => (
                    <span key={d.id} className="robo-badge text-xs">{d.dayLabel}</span>
                  ))}
                </div>
              </div>
            )}
            {week2Days.length > 0 && (
              <div>
                <p className="text-xs font-heading text-[#05575c]/50 mb-1">WEEK 2</p>
                <div className="flex flex-wrap gap-2">
                  {week2Days.map((d) => (
                    <span key={d.id} className="robo-badge text-xs">{d.dayLabel}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {bookingType === 'paid' && pricingInfo && (
          <div className="bg-gradient-to-r from-[#fff0fd] to-[#fff6ed] rounded-xl p-4">
            <h3 className="font-heading text-xs text-[#003439] mb-2">PAYMENT SUMMARY</h3>
            {pricingInfo.perChild.map((pc, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[#05575c]">
                  {form.children[i]?.firstName || `Child ${i + 1}`} — {pc.days} day{pc.days !== 1 ? 's' : ''}
                </span>
                <span className="font-semibold text-[#003439]">{formatPriceWhole(pc.pence)}</span>
              </div>
            ))}
            <div className="flex justify-between mt-3 pt-3 border-t border-[#ff00bf]/20">
              <span className="font-bold text-[#003439]">Total</span>
              <span className="text-xl font-heading text-[#ff00bf]">{formatPriceWhole(pricingInfo.totalPence)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#f0f7f7] rounded-xl p-4">
      <h3 className="font-heading text-xs text-[#05575c]/50 mb-2">{title.toUpperCase()}</h3>
      <div className="text-[#003439]">{children}</div>
    </div>
  );
}
