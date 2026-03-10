'use client';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export default function ProgressBar({ currentStep, totalSteps, labels }: ProgressBarProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        {labels.map((label, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                i < currentStep
                  ? 'bg-[#00dcde] text-[#003439]'
                  : i === currentStep
                  ? 'bg-[#ff00bf] text-white shadow-lg shadow-[#ff00bf]/30'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i < currentStep ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`text-xs mt-1 hidden sm:block text-center ${
              i <= currentStep ? 'text-[#003439] font-medium' : 'text-gray-400'
            }`}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${(currentStep / (totalSteps - 1)) * 100}%`,
            background: 'linear-gradient(90deg, #00dcde, #ff00bf)',
          }}
        />
      </div>
    </div>
  );
}
