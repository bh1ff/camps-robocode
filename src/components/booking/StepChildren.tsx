'use client';

import { useState } from 'react';
import { BookingFormState, ChildFormState } from './BookingWizard';
import { FormInput } from '@/components/ui/FormField';
import { ToggleGroup } from '@/components/ui/FormField';
import { SOLIHULL_SCHOOLS, SCHOOL_YEARS } from '@/lib/schools';

interface Props {
  form: BookingFormState;
  updateChild: (index: number, updates: Partial<ChildFormState>) => void;
  setChildCount: (count: number) => void;
  errors: Record<string, string>;
}

function SchoolSelect({ value, onChange, error }: {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = search
    ? SOLIHULL_SCHOOLS.filter((s) => s.toLowerCase().includes(search.toLowerCase()))
    : SOLIHULL_SCHOOLS;

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
              className="w-full text-left px-4 py-2 text-sm text-[#003439] hover:bg-[#f0f7f7] transition-colors first:rounded-t-xl last:rounded-b-xl"
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

export default function StepChildren({ form, updateChild, setChildCount, errors }: Props) {
  return (
    <div>
      <h2 className="text-xl font-heading text-[#003439] mb-2">CHILDREN DETAILS</h2>
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
                  required
                  value={child.age}
                  onChange={(e) => updateChild(index, { age: e.target.value })}
                  error={errors[`child${index}_age`]}
                  min="4"
                  max="18"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SchoolSelect
                  value={child.schoolName}
                  onChange={(val) => updateChild(index, { schoolName: val })}
                  error={errors[`child${index}_schoolName`]}
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
    </div>
  );
}
