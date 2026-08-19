

import { useState, useEffect } from 'react';

interface ScoreRingProps {
  score: number;
  label: string;
  size?: number;
  colorClass?: string;
}

/**
 * A CSS transition only fires when a value *changes*. This ring is mounted by
 * AnalysisPage behind `data!`, i.e. only once the scores have loaded, so it
 * used to render with its final strokeDashoffset already in place - and the
 * `duration-1000` on the circle never ran a single frame. The payoff of the
 * whole flow appeared fully drawn, instantly.
 *
 * So: paint one frame empty, then hand the real offset over on the next frame
 * and let the existing transition sweep it. If the score later changes while
 * mounted, `drawn` stays true and the transition runs from the value currently
 * on screen, which is the behaviour you want anyway.
 */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function ScoreRing({ 
  score, 
  label, 
  size = 120, 
  colorClass = 'text-[var(--color-primary)]' 
}: ScoreRingProps) {
  // Reduced motion skips the sweep entirely rather than doing it instantly -
  // seeding `true` means the final offset is in the very first paint, so there
  // is no one-frame flash of an empty ring on the way there.
  const [drawn, setDrawn] = useState(prefersReducedMotion);

  useEffect(() => {
    if (drawn) return;
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, [drawn]);

  const safeScore = isNaN(score) ? 0 : score;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Calculate stroke dashoffset for the score (0-100)
  const offset = circumference - (safeScore / 100) * circumference;

  // Determine color based on threshold if no specific color provided
  let defaultColor = 'text-[var(--color-primary)]';
  let trackColorClass = 'text-[var(--color-success-bg)]';
  if (!colorClass) {
    if (score >= 80) {
      defaultColor = 'text-[var(--color-success)]';
      trackColorClass = 'text-[var(--color-success-bg)]';
    } else if (score >= 60) {
      defaultColor = 'text-[var(--color-warning)]';
      trackColorClass = 'text-[var(--color-warning-bg)]';
    } else {
      defaultColor = 'text-[var(--color-danger)]';
      trackColorClass = 'text-[var(--color-danger-bg)]';
    }
  }

  const finalColorClass = colorClass || defaultColor;

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Background Track */}
        <svg className="absolute transform -rotate-90" width={size} height={size}>
          <circle
            className={trackColorClass}
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
            strokeDashoffset={drawn ? offset : circumference}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-[#111111] dark:text-[#e8e7e4] tracking-tighter">{score}</span>
          <span className="text-xs font-semibold text-[var(--color-muted)]">%</span>
        </div>
      </div>
      <span className="font-medium text-sm text-[var(--color-foreground)]">{label}</span>
    </div>
  );
}
