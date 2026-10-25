import React from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showDetails?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 96,
  strokeWidth = 7,
  showDetails = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  let strokeColor = '#FFFFFF'; // Clean Stark White
  let badgeStyle = 'badge-pass';
  let statusText = 'Optimal Health';

  if (safeScore < 70) {
    strokeColor = '#FB7185'; // Rose
    badgeStyle = 'badge-fail';
    statusText = 'Action Required';
  } else if (safeScore < 90) {
    strokeColor = '#FBBF24'; // Amber
    badgeStyle = 'badge-warn';
    statusText = 'Needs Attention';
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Subtle Dark Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#27272A"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active progress stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Precision numeric display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums leading-none">
            {safeScore}
          </span>
          <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-2 text-center">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium tracking-tight ${badgeStyle}`}>
            {statusText}
          </span>
        </div>
      )}
    </div>
  );
};
