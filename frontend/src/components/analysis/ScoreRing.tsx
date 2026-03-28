import React from 'react';

interface ScoreRingProps {
  score: number;
  label: string;
  size?: number;
  colorClass?: string;
}

export function ScoreRing({ 
  score, 
  label, 
  size = 120, 
  colorClass = 'text-[var(--color-primary)]' 
}: ScoreRingProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Calculate stroke dashoffset for the score (0-100)
  const offset = circumference - (score / 100) * circumference;

  // Determine color based on threshold if no specific color provided
  let defaultColor = 'text-[var(--color-primary)]';
  if (!colorClass) {
    if (score >= 80) defaultColor = 'text-[var(--color-success)]';
    else if (score >= 60) defaultColor = 'text-[var(--color-warning)]';
    else defaultColor = 'text-[var(--color-danger)]';
  }

  const finalColorClass = colorClass || defaultColor;

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Background Track */}
        <svg className="absolute transform -rotate-90" width={size} height={size}>
          <circle
            className="text-zinc-800"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress Ring */}
          <circle
            className={`${finalColorClass} transition-all duration-1000 ease-out`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={score === 0 ? circumference : offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-white tracking-tighter">{score}</span>
          <span className="text-xs font-semibold text-[var(--color-muted)]">%</span>
        </div>
      </div>
      <span className="font-medium text-sm text-[var(--color-foreground)]">{label}</span>
    </div>
  );
}
