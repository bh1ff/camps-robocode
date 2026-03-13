'use client';

import { BookingFormState } from './BookingWizard';
import { FormInput } from '@/components/ui/FormField';

interface Props {
  form: BookingFormState;
  updateForm: (updates: Partial<BookingFormState>) => void;
  errors: Record<string, string>;
  bookingType: 'haf' | 'paid';
}

export default function StepParent({ form, updateForm, errors, bookingType }: Props) {
  return (
    <div>
      <h2 className="text-xl font-heading text-[#003439] mb-2">PARENT / GUARDIAN DETAILS</h2>
      <p className="text-sm text-[#05575c]/70 mb-6">
        Please provide your contact information.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="First Name"
            required
            value={form.parentFirstName}
            onChange={(e) => updateForm({ parentFirstName: e.target.value })}
            error={errors.parentFirstName}
            placeholder="First name"
          />
          <FormInput
            label="Last Name"
            required
            value={form.parentLastName}
            onChange={(e) => updateForm({ parentLastName: e.target.value })}
            error={errors.parentLastName}
            placeholder="Last name"
          />
        </div>

        <FormInput
          label="Email Address"
          type="email"
          required
          value={form.parentEmail}
          onChange={(e) => updateForm({ parentEmail: e.target.value })}
          error={errors.parentEmail}
          placeholder="parent@email.com"
        />

        <FormInput
          label="Phone Number"
          type="tel"
          required
          value={form.parentPhone}
          onChange={(e) => updateForm({ parentPhone: e.target.value })}
          error={errors.parentPhone}
          placeholder="07..."
        />

        <FormInput
          label="Address"
          required
          value={form.address}
          onChange={(e) => updateForm({ address: e.target.value })}
          error={errors.address}
          placeholder="Full address"
        />

        <FormInput
          label="Post Code"
          required
          value={form.postcode}
          onChange={(e) => updateForm({ postcode: e.target.value })}
          error={errors.postcode}
          placeholder="B1 1AA"
        />
      </div>
    </div>
  );
}
