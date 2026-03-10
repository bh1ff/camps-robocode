'use client';

import { LocationData, BookingFormState } from './BookingWizard';

interface Props {
  locations: LocationData[];
  form: BookingFormState;
  updateForm: (updates: Partial<BookingFormState>) => void;
  errors: Record<string, string>;
  bookingType: 'haf' | 'paid';
}

export default function StepLocation({ locations, form, updateForm, errors, bookingType }: Props) {
  const handleSelect = (location: LocationData) => {
    const camp = location.camps[0];
    updateForm({
      locationId: location.id,
      campId: camp?.id || '',
      selectedDays: [],
    });
  };

  return (
    <div>
      <h2 className="text-xl font-heading text-[#003439] mb-2">CHOOSE YOUR LOCATION</h2>
      <p className="text-sm text-[#05575c]/70 mb-6">
        {bookingType === 'haf'
          ? 'Select the camp location nearest to you. HAF eligibility is based on your child\'s school or home area.'
          : 'Select the Robocode Centre for your booking.'}
      </p>

      <div className="space-y-3">
        {locations.map((location) => {
          const isSelected = form.locationId === location.id;
          const camp = location.camps[0];
          const totalDays = camp?.campDays.length || 0;

          return (
            <button
              key={location.id}
              type="button"
              onClick={() => handleSelect(location)}
              className={`w-full p-5 rounded-xl text-left transition-all border-2 ${
                isSelected
                  ? 'border-[#00dcde] bg-[#edfffe] shadow-md'
                  : 'border-gray-200 bg-white hover:border-[#00dcde]/50 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-[#003439] text-lg">{location.name}</h3>
                  <p className="text-sm text-[#05575c]/70 mt-1">{location.address}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#00dcde]/15 text-[#003439]">
                      {totalDays} days
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#ff9752]/15 text-[#7e2610]">
                      {location.region === 'solihull' ? 'Solihull' : 'Birmingham'}
                    </span>
                    {location.allowsPaid && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#ff00bf]/10 text-[#98036c]">
                        Paid spots available
                      </span>
                    )}
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                  isSelected ? 'border-[#00dcde] bg-[#00dcde]' : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              {bookingType === 'haf' && (
                <p className="text-xs text-[#05575c]/50 mt-3 border-t border-gray-100 pt-2">
                  {location.region === 'solihull'
                    ? 'Eligible for children who live in or attend school in Solihull.'
                    : 'Eligible for children who live in or attend school in Birmingham.'}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {errors.campId && (
        <p className="text-red-500 text-sm mt-3">{errors.campId}</p>
      )}
    </div>
  );
}
