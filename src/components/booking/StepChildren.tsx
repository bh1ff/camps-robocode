'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookingFormState, ChildFormState } from './BookingWizard';
import { FormInput, FormSelect } from '@/components/ui/FormField';
import { ToggleGroup } from '@/components/ui/FormField';
import { SCHOOL_YEARS, getSchoolsForRegion } from '@/lib/schools';

const ETHNICITY_OPTIONS = [
  { value: 'white_british', label: 'White - British' },
  { value: 'white_irish', label: 'White - Irish' },
  { value: 'white_other', label: 'White - Any other White background' },
  { value: 'mixed_white_black_caribbean', label: 'Mixed - White and Black Caribbean' },
  { value: 'mixed_white_black_african', label: 'Mixed - White and Black African' },
  { value: 'mixed_white_asian', label: 'Mixed - White and Asian' },
  { value: 'mixed_other', label: 'Mixed - Any other Mixed background' },
  { value: 'asian_indian', label: 'Asian - Indian' },
  { value: 'asian_pakistani', label: 'Asian - Pakistani' },
  { value: 'asian_bangladeshi', label: 'Asian - Bangladeshi' },
  { value: 'asian_chinese', label: 'Asian - Chinese' },
  { value: 'asian_other', label: 'Asian - Any other Asian background' },
  { value: 'black_african', label: 'Black - African' },
  { value: 'black_caribbean', label: 'Black - Caribbean' },
  { value: 'black_other', label: 'Black - Any other Black background' },
  { value: 'arab', label: 'Arab' },
  { value: 'other', label: 'Any other ethnic group' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

interface Props {
  form: BookingFormState;
  updateChild: (index: number, updates: Partial<ChildFormState>) => void;
  setChildCount: (count: number) => void;
  errors: Record<string, string>;
  bookingType: 'haf' | 'paid';
  locationRegion: string;
}

const NOT_LISTED = "My child's school is not listed";

type EligibilityRoute = 'unchecked' | 'school_in_area' | 'lives_in_area' | 'not_eligible';

function EligibilityGate({ region, onConfirm }: {
  region: string;
  onConfirm: (route: EligibilityRoute) => void;
}) {
  const [schoolInArea, setSchoolInArea] = useState<boolean | null>(null);
  const [livesInArea, setLivesInArea] = useState<boolean | null>(null);
  const [hasCouncilCode, setHasCouncilCode] = useState<boolean | null>(null);

  const regionLabel = region === 'birmingham' ? 'Birmingham' : 'Solihull';
  const councilName = region === 'birmingham' ? 'Birmingham City Council' : 'Solihull Council';

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-[#003439] mb-3">
          Does your child attend a school in {regionLabel}?
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setSchoolInArea(true);
              setLivesInArea(null);
              setHasCouncilCode(null);
              onConfirm('school_in_area');
            }}
            className={`py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
              schoolInArea === true
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-white text-[#003439] hover:border-emerald-400/50'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => {
              setSchoolInArea(false);
              onConfirm('unchecked');
            }}
            className={`py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
              schoolInArea === false
                ? 'border-[#003439] bg-[#003439]/5 text-[#003439]'
                : 'border-gray-200 bg-white text-[#003439] hover:border-gray-300'
            }`}
          >
            No
          </button>
        </div>
      </div>

      {schoolInArea === false && (
        <div>
          <p className="text-sm font-semibold text-[#003439] mb-3">
            Does your child live in {regionLabel}?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setLivesInArea(true);
                setHasCouncilCode(null);
              }}
              className={`py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                livesInArea === true
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-[#003439] hover:border-emerald-400/50'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => {
                setLivesInArea(false);
                setHasCouncilCode(null);
                onConfirm('not_eligible');
              }}
              className={`py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                livesInArea === false
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-white text-[#003439] hover:border-gray-300'
              }`}
            >
              No
            </button>
          </div>
        </div>
      )}

      {schoolInArea === false && livesInArea === true && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-[#003439] font-semibold mb-2">
            Your child may still be eligible
          </p>
          <p className="text-xs text-[#05575c]/70 mb-4">
            Children who live in {regionLabel} but attend school outside the area can still access
            free HAF places. You will need to contact <strong>{councilName}</strong> HAF team
            directly to request a code.
          </p>
          <p className="text-sm font-semibold text-[#003439] mb-3">
            Have you already obtained a HAF code from the council?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setHasCouncilCode(true);
                onConfirm('lives_in_area');
              }}
              className={`py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                hasCouncilCode === true
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-[#003439] hover:border-emerald-400/50'
              }`}
            >
              Yes, I have a code
            </button>
            <button
              type="button"
              onClick={() => {
                setHasCouncilCode(false);
                onConfirm('unchecked');
              }}
              className={`py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                hasCouncilCode === false
                  ? 'border-[#003439] bg-[#003439]/5 text-[#003439]'
                  : 'border-gray-200 bg-white text-[#003439] hover:border-gray-300'
              }`}
            >
              No, not yet
            </button>
          </div>
        </div>
      )}

      {schoolInArea === false && livesInArea === true && hasCouncilCode === false && (
        <div className="bg-[#f0f7f7] border border-[#003439]/10 rounded-xl p-4">
          <p className="text-sm text-[#003439] font-semibold mb-2">
            You will need a code first
          </p>
          <p className="text-xs text-[#05575c]/70 mb-4">
            Contact the <strong>{councilName}</strong> HAF team to request your code, then come back to complete your booking.
          </p>
          <p className="text-xs text-[#05575c]/60 mb-1">In the meantime, you can still book a paid place:</p>
          <Link
            href="/book/paid"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ff00bf] hover:text-[#e600ac] transition-colors"
          >
            Book a paid camp instead &rarr;
          </Link>
        </div>
      )}

      {schoolInArea === false && livesInArea === false && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-[#003439] font-semibold mb-2">
            Not eligible at this location
          </p>
          <p className="text-xs text-[#05575c]/70 mb-4">
            HAF places at this location are for children who attend school in or live
            in {regionLabel}. You could try a different location, or book a paid camp:
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/book/haf"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00adb3] hover:text-[#003439] transition-colors"
            >
              Try another location &rarr;
            </Link>
            <span className="text-xs text-[#05575c]/30">or</span>
            <Link
              href="/book/paid"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ff00bf] hover:text-[#e600ac] transition-colors"
            >
              Book a paid camp &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function SchoolSelect({ value, onChange, error, region, manualOnly }: {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  region: string;
  manualOnly?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  if (manualOnly) {
    return (
      <div>
        <label className="block text-sm font-semibold text-[#003439] mb-1">
          School Attending <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type the full school name..."
          className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-[#003439] placeholder-gray-400 focus:outline-none focus:border-[#00dcde] ${
            error ? 'border-red-300 bg-red-50' : value ? 'border-[#00dcde] bg-[#f0f7f7]' : 'border-gray-200'
          }`}
        />
        <p className="text-xs text-[#05575c]/40 mt-1">
          Enter the name of the school your child attends.
        </p>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }

  const schools = getSchoolsForRegion(region);
  const isNotListed = value === NOT_LISTED || (value !== '' && !schools.includes(value as typeof schools[number]));

  const filtered = search
    ? schools.filter((s) => s.toLowerCase().includes(search.toLowerCase()))
    : schools;

  if (isNotListed && value !== NOT_LISTED) {
    return (
      <div>
        <label className="block text-sm font-semibold text-[#003439] mb-1">
          School Attending <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-[#05575c]/60 bg-gray-100 px-2.5 py-1 rounded-lg">
            Other school
          </span>
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-[#00adb3] hover:text-[#003439] font-semibold transition-colors"
          >
            Back to list
          </button>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value || NOT_LISTED)}
          placeholder="Type the full school name..."
          className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-[#003439] placeholder-gray-400 focus:outline-none focus:border-[#00dcde] ${
            error ? 'border-red-300 bg-red-50' : value && value !== NOT_LISTED ? 'border-[#00dcde] bg-[#f0f7f7]' : 'border-gray-200'
          }`}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }

  if (value === NOT_LISTED) {
    return (
      <div>
        <label className="block text-sm font-semibold text-[#003439] mb-1">
          School Attending <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-[#05575c]/60 bg-gray-100 px-2.5 py-1 rounded-lg">
            Not in list
          </span>
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-[#00adb3] hover:text-[#003439] font-semibold transition-colors"
          >
            Back to list
          </button>
        </div>
        <input
          type="text"
          value=""
          onChange={(e) => onChange(e.target.value || NOT_LISTED)}
          placeholder="Type the full school name..."
          className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-[#003439] placeholder-gray-400 focus:outline-none focus:border-[#00dcde] border-gray-200`}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-[#003439] mb-1">
        School Attending <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        value={value || search}
        onChange={(e) => {
          setSearch(e.target.value);
          if (value) onChange('');
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search for school..."
        className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-[#003439] placeholder-gray-400 focus:outline-none focus:border-[#00dcde] ${
          error ? 'border-red-300 bg-red-50' : value ? 'border-[#00dcde] bg-[#f0f7f7]' : 'border-gray-200'
        }`}
      />
      {open && !value && (
        <div className="absolute z-20 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((school) => (
            <button
              key={school}
              type="button"
              onClick={() => {
                onChange(school);
                setSearch('');
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                school === NOT_LISTED
                  ? 'text-[#05575c]/60 font-semibold bg-gray-50 hover:bg-gray-100'
                  : 'text-[#003439] hover:bg-[#f0f7f7]'
              }`}
            >
              {school}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-2 text-sm text-gray-400">No schools found</p>
          )}
        </div>
      )}
      {value && (
        <button
          type="button"
          onClick={() => { onChange(''); setSearch(''); }}
          className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 text-sm"
        >
          Clear
        </button>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function StepChildren({ form, updateChild, setChildCount, errors, bookingType, locationRegion }: Props) {
  const isHaf = bookingType === 'haf';
  const isBirmingham = locationRegion === 'birmingham';
  const regionLabel = locationRegion === 'birmingham' ? 'Birmingham' : 'Solihull';

  const [eligibility, setEligibility] = useState<EligibilityRoute>('unchecked');
  const eligible = eligibility === 'school_in_area' || eligibility === 'lives_in_area';

  return (
    <div>
      <h2 className="text-xl font-heading text-[#003439] mb-2">CHILDREN DETAILS</h2>

      {isHaf && !eligible && (
        <div className="mb-6">
          <p className="text-sm text-[#05575c]/70 mb-5">
            Before we continue, we need to check your child is eligible for a free HAF place at this {regionLabel} location.
          </p>
          <EligibilityGate region={locationRegion} onConfirm={setEligibility} />
        </div>
      )}

      {isHaf && eligible && (
        <div className="flex items-center gap-2 mb-5">
          <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span className="text-xs text-emerald-700 font-semibold">
            {eligibility === 'school_in_area'
              ? `Eligible: child attends school in ${regionLabel}`
              : `Eligible: child lives in ${regionLabel} (code from council)`}
          </span>
          <button
            type="button"
            onClick={() => setEligibility('unchecked')}
            className="ml-auto text-[10px] text-[#05575c]/30 hover:text-[#05575c]/60 transition-colors"
          >
            Change
          </button>
        </div>
      )}

      {(!isHaf || eligible) && (
        <>
          <p className="text-sm text-[#05575c]/70 mb-6">
            How many children are you registering?
          </p>

          <div className="flex gap-3 mb-6">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setChildCount(n)}
                className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all border-2 ${
                  form.numberOfChildren === n
                    ? 'bg-[#00dcde] text-[#003439] border-[#00dcde]'
                    : 'bg-white text-[#003439] border-gray-200 hover:border-[#00dcde]/50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {form.children.map((child, index) => (
              <div key={index} className="border-2 border-gray-100 rounded-xl p-5">
                {form.numberOfChildren > 1 && (
                  <h3 className="font-heading text-[#003439] text-sm mb-4">
                    CHILD {index + 1}
                  </h3>
                )}

                <div className="space-y-4">
                  {isHaf && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <FormInput
                        label="HAF / Eligibility Code"
                        required
                        value={child.hafCode}
                        onChange={(e) => updateChild(index, { hafCode: e.target.value })}
                        error={errors[`child${index}_hafCode`]}
                        placeholder="Enter this child's unique HAF code"
                      />
                      <p className="text-xs text-[#05575c]/50 mt-1">
                        Each child has their own unique code, issued by the council or school.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="First Name"
                      required
                      value={child.firstName}
                      onChange={(e) => updateChild(index, { firstName: e.target.value })}
                      error={errors[`child${index}_firstName`]}
                      placeholder="First name"
                    />
                    <FormInput
                      label="Last Name"
                      required
                      value={child.lastName}
                      onChange={(e) => updateChild(index, { lastName: e.target.value })}
                      error={errors[`child${index}_lastName`]}
                      placeholder="Last name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="Date of Birth"
                      type="date"
                      required
                      value={child.dateOfBirth}
                      onChange={(e) => {
                        const dob = e.target.value;
                        const today = new Date();
                        const birthDate = new Date(dob);
                        let age = today.getFullYear() - birthDate.getFullYear();
                        const m = today.getMonth() - birthDate.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                        updateChild(index, { dateOfBirth: dob, age: age > 0 ? String(age) : '' });
                      }}
                      error={errors[`child${index}_dateOfBirth`]}
                    />
                    <FormInput
                      label="Age"
                      type="number"
                      value={child.age}
                      onChange={() => {}}
                      disabled
                      className="!bg-gray-50 !text-gray-500 !border-gray-200 cursor-not-allowed"
                      error={errors[`child${index}_age`]}
                    />
                  </div>

                  {isHaf && (
                    <div className="grid grid-cols-2 gap-4">
                      <SchoolSelect
                        value={child.schoolName}
                        onChange={(val) => updateChild(index, { schoolName: val })}
                        error={errors[`child${index}_schoolName`]}
                        region={locationRegion}
                        manualOnly={eligibility === 'lives_in_area'}
                      />
                      <div>
                        <label className="block text-sm font-semibold text-[#003439] mb-1">
                          School Year <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={child.schoolYear}
                          onChange={(e) => updateChild(index, { schoolYear: e.target.value })}
                          className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-[#003439] focus:outline-none focus:border-[#00dcde] ${
                            errors[`child${index}_schoolYear`]
                              ? 'border-red-300 bg-red-50'
                              : child.schoolYear
                              ? 'border-[#00dcde] bg-[#f0f7f7]'
                              : 'border-gray-200'
                          }`}
                        >
                          <option value="">Select year...</option>
                          {SCHOOL_YEARS.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        {errors[`child${index}_schoolYear`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`child${index}_schoolYear`]}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {isHaf && (
                    <ToggleGroup
                      label="Eligible for benefit-related Free School Meals (FSM)?"
                      value={child.fsmEligible}
                      onChange={(val) => updateChild(index, { fsmEligible: val })}
                      required
                    />
                  )}

                  {isHaf && isBirmingham && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormSelect
                        label="Ethnicity"
                        required
                        value={child.ethnicity}
                        onChange={(e) => updateChild(index, { ethnicity: e.target.value })}
                        error={errors[`child${index}_ethnicity`]}
                        options={ETHNICITY_OPTIONS}
                      />
                      <FormSelect
                        label="Gender"
                        required
                        value={child.gender}
                        onChange={(e) => updateChild(index, { gender: e.target.value })}
                        error={errors[`child${index}_gender`]}
                        options={GENDER_OPTIONS}
                      />
                    </div>
                  )}

                  <ToggleGroup
                    label="SEND? (Special Educational Needs or Disabilities)"
                    value={child.hasSEND}
                    onChange={(val) => updateChild(index, { hasSEND: val })}
                    required
                  />

                  {child.hasSEND && (
                    <ToggleGroup
                      label="Does your child have an EHCP (Education Health Care Plan)?"
                      value={child.hasEHCP}
                      onChange={(val) => updateChild(index, { hasEHCP: val })}
                    />
                  )}

                  {child.hasEHCP && (
                    <FormInput
                      label="EHCP Details"
                      value={child.ehcpDetails}
                      onChange={(e) => updateChild(index, { ehcpDetails: e.target.value })}
                      placeholder="Please provide relevant details"
                    />
                  )}

                  <ToggleGroup
                    label="Any Allergies?"
                    value={child.hasAllergies}
                    onChange={(val) => updateChild(index, { hasAllergies: val })}
                    required
                  />

                  {child.hasAllergies && (
                    <FormInput
                      label="Please Specify Allergies"
                      required
                      value={child.allergyDetails}
                      onChange={(e) => updateChild(index, { allergyDetails: e.target.value })}
                      placeholder="List allergies..."
                    />
                  )}

                  <ToggleGroup
                    label="I give permission for Robocode to take and use photos/videos of my child for promotional purposes"
                    value={child.photoPermission}
                    onChange={(val) => updateChild(index, { photoPermission: val })}
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
