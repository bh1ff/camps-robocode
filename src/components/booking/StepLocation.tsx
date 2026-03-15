'use client';

import { useState } from 'react';
import Image from 'next/image';
import { LocationData, BookingFormState } from './BookingWizard';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function ordinal(n: number): string {
  if (n > 3 && n < 21) return n + 'th';
  const s = ['th', 'st', 'nd', 'rd'];
  return n + (s[n % 10] || s[0]);
}

function summariseCampDates(dayObjs: { id: string; date: string }[]): string {
  if (dayObjs.length === 0) return '';
  const dates = dayObjs
    .map((d) => new Date(d.date))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  if (dates.length === 0) return '';

  const runs: Date[][] = [];
  let run: Date[] = [dates[0]];
  for (let i = 1; i < dates.length; i++) {
    const gap = Math.round((dates[i].getTime() - run[run.length - 1].getTime()) / 86400000);
    if (gap === 1) {
      run.push(dates[i]);
    } else {
      runs.push(run);
      run = [dates[i]];
    }
  }
  runs.push(run);

  const groups: Date[][][] = [[runs[0]]];
  for (let i = 1; i < runs.length; i++) {
    const lastGroup = groups[groups.length - 1];
    const lastRun = lastGroup[lastGroup.length - 1];
    const gap = Math.round((runs[i][0].getTime() - lastRun[lastRun.length - 1].getTime()) / 86400000);
    const sameLen = lastRun.length === runs[i].length;
    const sameDow = lastRun[0].getUTCDay() === runs[i][0].getUTCDay();
    if (gap >= 2 && gap <= 5 && sameLen && sameDow) {
      lastGroup.push(runs[i]);
    } else {
      groups.push([runs[i]]);
    }
  }

  const parts = groups.map((group) => {
    const all = group.flat();
    const first = all[0];
    const last = all[all.length - 1];
    if (all.length === 1) {
      return `${DAY_NAMES[first.getUTCDay()]} ${ordinal(first.getUTCDate())} ${MONTH_NAMES[first.getUTCMonth()]}`;
    }
    const dows = [...new Set(all.map((d) => d.getUTCDay()))].sort((a, b) => a - b);
    const dowStr = dows.length === 1
      ? DAY_NAMES[dows[0]]
      : `${DAY_NAMES[dows[0]]}–${DAY_NAMES[dows[dows.length - 1]]}`;
    const sameMonth = first.getUTCMonth() === last.getUTCMonth();
    if (sameMonth) {
      return `${dowStr}, ${ordinal(first.getUTCDate())}–${ordinal(last.getUTCDate())} ${MONTH_NAMES[first.getUTCMonth()]}`;
    }
    return `${dowStr}, ${ordinal(first.getUTCDate())} ${MONTH_NAMES[first.getUTCMonth()]} – ${ordinal(last.getUTCDate())} ${MONTH_NAMES[last.getUTCMonth()]}`;
  });

  return parts.join(' & ');
}

interface Props {
  locations: LocationData[];
  form: BookingFormState;
  updateForm: (updates: Partial<BookingFormState>) => void;
  errors: Record<string, string>;
  bookingType: 'haf' | 'paid';
  initialRegion?: string;
}

export default function StepLocation({ locations, form, updateForm, errors, bookingType, initialRegion }: Props) {
  const regionSlugs = [...new Set(locations.map((l) => l.region))].sort();
  const [regionFilter, setRegionFilter] = useState<string>(initialRegion || 'all');

  const handleSelect = (location: LocationData) => {
    const camp = location.camps[0];
    updateForm({
      locationId: location.id,
      campId: camp?.id || '',
      selectedVariant: bookingType,
      selectedDays: [],
    });
  };

  const relevantLocations = locations.filter((loc) => {
    if (bookingType === 'haf') return loc.camps.some((c) => c.allowsHaf);
    if (bookingType === 'paid') return loc.camps.some((c) => c.allowsPaid);
    return true;
  });

  const filtered = relevantLocations.filter((loc) => {
    if (regionFilter !== 'all' && loc.region !== regionFilter) return false;
    return true;
  });

  const hasOtherRegion = regionFilter !== 'all' && relevantLocations.some((l) => l.region !== regionFilter);

  return (
    <div>
      <h2 className="text-xl font-heading text-[#003439] mb-2">CHOOSE YOUR LOCATION</h2>
      <p className="text-sm text-[#05575c]/70 mb-5">
        {bookingType === 'haf'
          ? 'Select the camp location nearest to you. HAF eligibility is based on your child\'s school or home area.'
          : 'Select the Robocode Centre for your booking.'}
      </p>

      <div className="mb-6">
        <span className="text-xs font-semibold text-[#05575c]/50 uppercase tracking-wider">Region</span>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {[['all', 'All'], ...regionSlugs.map((s) => [s, s.charAt(0).toUpperCase() + s.slice(1)])].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRegionFilter(value)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                regionFilter === value
                  ? 'bg-[#003439] text-white shadow-sm'
                  : 'bg-gray-100 text-[#05575c]/70 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 px-2">
          <p className="text-base font-semibold text-[#003439] mb-1">No camps in this area right now</p>
          {hasOtherRegion && (
            <>
              <p className="text-sm text-[#05575c]/60 mb-4">How about trying another region?</p>
              <button
                type="button"
                onClick={() => setRegionFilter('all')}
                className="px-5 py-2.5 rounded-xl border-2 border-[#00dcde]/20 bg-[#edfffe]/40 hover:border-[#00dcde] hover:bg-[#edfffe] hover:shadow-md transition-all text-sm font-semibold text-[#003439]"
              >
                Show all regions
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              isSelected={form.locationId === loc.id}
              onSelect={handleSelect}
              bookingType={bookingType}
            />
          ))}
        </div>
      )}

      {errors.campId && (
        <p className="text-red-500 text-sm mt-3">{errors.campId}</p>
      )}
    </div>
  );
}

function LocationCard({
  location,
  isSelected,
  onSelect,
  bookingType,
}: {
  location: LocationData;
  isSelected: boolean;
  onSelect: (loc: LocationData) => void;
  bookingType: 'haf' | 'paid';
}) {
  const camp = location.camps[0];
  const campDays = camp?.campDays || [];
  const imgSrc = location.imageUrl || '/camp/location-shirley-centre.jpg';

  const isHaf = bookingType === 'haf';
  const accentColor = isSelected
    ? 'border-[#00dcde]'
    : isHaf ? 'border-emerald-400/30' : 'border-[#ff00bf]/30';

  const typeBadge = isHaf
    ? { label: 'HAF Free', bg: 'bg-emerald-500' }
    : { label: 'Paid', bg: 'bg-[#ff00bf]' };

  return (
    <button
      type="button"
      onClick={() => onSelect(location)}
      className={`w-full rounded-xl text-left transition-all border-2 overflow-hidden ${
        isSelected
          ? 'border-[#00dcde] bg-[#edfffe] shadow-md ring-2 ring-[#00dcde]/20'
          : 'border-gray-200 bg-white hover:border-[#00dcde]/50 hover:shadow-sm'
      }`}
    >
      <div className="relative aspect-[16/7] w-full">
        <Image
          src={imgSrc}
          alt={`${location.name} venue`}
          fill
          className="object-cover"
          sizes="(max-width:640px) 100vw, 600px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${typeBadge.bg} text-white shadow-sm uppercase tracking-wide`}>
            {typeBadge.label}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 text-[#003439] shadow-sm">
            {location.region.charAt(0).toUpperCase() + location.region.slice(1)}
          </span>
        </div>

        {isSelected && (
          <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#00dcde] flex items-center justify-center shadow-md">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      <div className={`p-4 border-l-4 ${accentColor}`}>
        <h3 className="font-bold text-[#003439] text-lg leading-tight">{location.name}</h3>
        <p className="text-sm text-[#05575c]/60 mt-1">{location.address}</p>

        {campDays.length > 0 && (
          <div className="mt-3 flex items-start gap-1.5 text-xs text-[#05575c]/70">
            <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="leading-relaxed font-bold text-[#003439]">
              {summariseCampDates(campDays)}
            </span>
          </div>
        )}

        {isHaf && (
          <p className="text-xs text-[#05575c]/50 mt-3 border-t border-gray-100 pt-2">
            Eligible for children who live in or attend school in {location.region.charAt(0).toUpperCase() + location.region.slice(1)}.
          </p>
        )}
      </div>
    </button>
  );
}
