import Link from 'next/link';

export const metadata = { title: 'Unsubscribed — Robocode' };

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-[#f6f9f9] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-[#edfffe] flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-[#003439]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#003439] mb-2">You&apos;ve been unsubscribed</h1>
        <p className="text-sm text-[#05575c]/60 mb-6">
          You won&apos;t receive any more emails from us about upcoming camps. We&apos;re sorry to see you go!
        </p>
        <a
          href="https://robocode.uk"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003439] text-white text-sm font-semibold rounded-full hover:bg-[#004a52] transition-colors"
        >
          Back to Robocode
        </a>
      </div>
    </div>
  );
}
