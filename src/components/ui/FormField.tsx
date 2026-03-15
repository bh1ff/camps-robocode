'use client';

import { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormInput({ label, error, className = '', ...props }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-[#003439]">
        {label}
        {props.required && <span className="text-[#ff00bf] ml-1">*</span>}
      </label>
      <input
        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-[#003439] bg-white
          ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-gray-200 focus:border-[#00dcde] focus:ring-2 focus:ring-[#00dcde]/20'
          }
          outline-none ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function FormSelect({ label, error, options, className = '', ...props }: FormSelectProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-[#003439]">
        {label}
        {props.required && <span className="text-[#ff00bf] ml-1">*</span>}
      </label>
      <select
        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-[#003439] bg-white
          ${error
            ? 'border-red-400 focus:border-red-500'
            : 'border-gray-200 focus:border-[#00dcde]'
          }
          outline-none ${className}`}
        {...props}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

interface ToggleGroupProps {
  label: string;
  value: boolean | null | undefined;
  onChange: (val: boolean) => void;
  error?: string;
  required?: boolean;
}

export function ToggleGroup({ label, value, onChange, error, required }: ToggleGroupProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-[#003439]">
        {label}
        {required && <span className="text-[#ff00bf] ml-1">*</span>}
      </label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all border-2 ${
            value === true
              ? 'bg-[#00dcde] text-[#003439] border-[#00dcde]'
              : 'bg-white text-gray-500 border-gray-200 hover:border-[#00dcde]/50'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all border-2 ${
            value === false
              ? 'bg-[#003439] text-white border-[#003439]'
              : 'bg-white text-gray-500 border-gray-200 hover:border-[#003439]/50'
          }`}
        >
          No
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
