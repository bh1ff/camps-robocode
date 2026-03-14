'use client';

import { calculateBookingTotalWithTiers, formatPriceWhole, type PriceTierData } from '@/lib/pricing';

interface CampDay {
  id: string;
  date: string;
  dayLabel: string;
  weekNumber: number;
}

interface Props {
  campDays: CampDay[];
  selectedDays: string[];
  onChange: (days: string[]) => void;
  errors: Record<string, string>;
  bookingType: 'haf' | 'paid';
  childCount: number;
  priceTiers: PriceTierData[];
}

export default function StepDays({ campDays, selectedDays, onChange, errors, bookingType, childCount, priceTiers }: Props) {
  const week1 = campDays.filter((d) => d.weekNumber === 1);
  const week2 = campDays.filter((d) => d.weekNumber === 2);

  const toggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      onChange(selectedDays.filter((d) => d !== dayId));
    } else {
      onChange([...selectedDays, dayId]);
    }
  };

  const toggleAllWeek = (weekDays: CampDay[]) => {
    const weekDayIds = weekDays.map((d) => d.id);
    const allSelected = weekDayIds.every((id) => selectedDays.includes(id));

    if (allSelected) {
      onChange(selectedDays.filter((d) => !weekDayIds.includes(d)));
    } else {
      const newDays = [...new Set([...selectedDays, ...weekDayIds])];
      onChange(newDays);
    }
  };

  const pricingInfo = bookingType === 'paid' && selectedDays.length > 0 && priceTiers.length > 0
    ? calculateBookingTotalWithTiers(Array(childCount).fill(selectedDays.length), priceTiers)
    : null;

  return (
    <div>
      <h2 className="text-xl font-heading text-[#003439] mb-2">SELECT YOUR DAYS</h2>
      <p className="text-sm text-[#05575c]/70 mb-6">
        Choose which days your {childCount > 1 ? 'children' : 'child'} will attend. All sessions run 10:00 AM - 2:00 PM.
      </p>

      {[
        { label: 'Week 1', days: week1, number: 1 },
        { label: 'Week 2', days: week2, number: 2 },
      ].filter(w => w.days.length > 0).map((week) => {
        const allSelected = week.days.every((d) => selectedDays.includes(d.id));

        return (
          <div key={week.number} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-sm text-[#003439]">{week.label}</h3>
              <button
                type="button"
                onClick={() => toggleAllWeek(week.days)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${
                  allSelected
                    ? 'bg-[#00dcde] text-[#003439] border-[#00dcde]'
                    : 'bg-white text-[#05575c] border-gray-200 hover:border-[#00dcde]'
                }`}
              >
                {allSelected ? 'Deselect All' : 'Select All Week'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {week.days.map((day) => {
                const isSelected = selectedDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`p-3 rounded-xl text-left transition-all border-2 ${
                      isSelected
                        ? 'border-[#00dcde] bg-[#edfffe]'
                        : 'border-gray-200 bg-white hover:border-[#00dcde]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'bg-[#00dcde] border-[#00dcde]' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm font-medium ${isSelected ? 'text-[#003439]' : 'text-gray-600'}`}>
                        {day.dayLabel}
                      </span>
                    </div>
                    <p className="text-xs text-[#05575c]/50 mt-1 ml-7">10:00 AM - 2:00 PM</p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {bookingType === 'paid' && selectedDays.length > 0 && pricingInfo && (
        <div className="bg-gradient-to-r from-[#fff0fd] to-[#fff6ed] rounded-xl p-4 mt-4">
          <h4 className="font-heading text-xs text-[#003439] mb-2">PRICING SUMMARY</h4>
          {pricingInfo.perChild.map((pc, i) => (
            <div key={i} className="flex justify-between text-sm text-[#05575c]">
              <span>Child {childCount > 1 ? i + 1 : ''} ({pc.days} day{pc.days !== 1 ? 's' : ''})</span>
              <span className="font-semibold">{formatPriceWhole(pc.pence)}</span>
            </div>
          ))}
          {childCount > 1 && (
            <div className="flex justify-between text-sm font-bold text-[#003439] border-t border-[#ff00bf]/20 mt-2 pt-2">
              <span>Total</span>
              <span className="text-[#ff00bf]">{formatPriceWhole(pricingInfo.totalPence)}</span>
            </div>
          )}
        </div>
      )}

      {errors.selectedDays && (
        <p className="text-red-500 text-sm mt-3">{errors.selectedDays}</p>
      )}
    </div>
  );
}
