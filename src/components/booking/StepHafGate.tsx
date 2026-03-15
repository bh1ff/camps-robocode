'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RegionOption {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  onConfirm: (region: string) => void;
}

export default function StepHafGate({ onConfirm }: Props) {
  const [hasCode, setHasCode] = useState<boolean | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [regions, setRegions] = useState<RegionOption[]>([]);

  useEffect(() => {
    fetch('/api/regions')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setRegions(data); })
      .catch(() => {});
  }, []);

  return (
    <div>
      <h2 className="text-xl font-heading text-[#003439] mb-2">DO YOU HAVE A HAF CODE?</h2>
      <p className="text-sm text-[#05575c]/70 mb-6">
        To book a free HAF place, each child needs a unique HAF eligibility code.
        This is sent to eligible families by the council or school.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={() => setHasCode(true)}
          className={`p-5 rounded-xl border-2 text-center transition-all ${
            hasCode === true
              ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-500/20'
              : 'border-gray-200 bg-white hover:border-emerald-400/50 hover:shadow-sm'
          }`}
        >
          <span className="block text-2xl mb-2">&#10003;</span>
          <span className="font-bold text-[#003439] text-sm">Yes, I have a code</span>
        </button>

        <button
          type="button"
          onClick={() => setHasCode(false)}
          className={`p-5 rounded-xl border-2 text-center transition-all ${
            hasCode === false
              ? 'border-[#ff00bf] bg-[#fff5fc] shadow-md ring-2 ring-[#ff00bf]/20'
              : 'border-gray-200 bg-white hover:border-[#ff00bf]/30 hover:shadow-sm'
          }`}
        >
          <span className="block text-2xl mb-2">&#10007;</span>
          <span className="font-bold text-[#003439] text-sm">No / I&apos;m not sure</span>
        </button>
      </div>

      {hasCode === true && (
        <div className="space-y-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
            <p className="text-sm text-[#003439] font-semibold mb-1">Great, you can proceed!</p>
            <p className="text-xs text-[#05575c]/70">
              You will enter each child&apos;s individual HAF code in the children details step.
            </p>
          </div>

          <div>
            <h3 className="text-base font-heading text-[#003439] mb-1">WHICH AREA ARE YOU IN?</h3>
            <p className="text-xs text-[#05575c]/60 mb-4">
              This helps us show you the nearest available camps.
            </p>

            <div className="space-y-2.5">
              {regions.map((r) => (
                <button
                  key={r.slug}
                  type="button"
                  onClick={() => setSelectedRegion(r.slug)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    selectedRegion === r.slug
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-gray-200 bg-white hover:border-emerald-400/40 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedRegion === r.slug ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                  }`}>
                    {selectedRegion === r.slug && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-[#003439] text-sm">{r.name}</p>
                    <p className="text-xs text-[#05575c]/50">{r.name} and surrounding areas</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onConfirm(selectedRegion)}
              disabled={!selectedRegion}
              className="w-full mt-5 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue to locations
            </button>
          </div>
        </div>
      )}

      {hasCode === false && (
        <div className="bg-[#fff5fc] border border-[#ff00bf]/20 rounded-xl p-5">
          <p className="text-sm text-[#003439] font-semibold mb-2">No worries!</p>
          <p className="text-xs text-[#05575c]/70 mb-3">
            HAF codes are sent to families whose children receive benefit-related free school meals.
            If you think your child qualifies, contact their school to request a code.
          </p>
          <p className="text-xs text-[#05575c]/70 mb-4">
            In the meantime, you can still book a paid camp place:
          </p>
          <Link
            href="/book/paid"
            className="block w-full text-center px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#ff00bf] to-[#ff58ea] hover:from-[#e600ac] hover:to-[#ff00bf] shadow-md shadow-[#ff00bf]/20 transition-all"
          >
            Book a Paid Camp instead
          </Link>
          <p className="text-[10px] text-[#05575c]/40 mt-3 text-center">
            Paid camps start from just &pound;25 per day
          </p>
        </div>
      )}
    </div>
  );
}
