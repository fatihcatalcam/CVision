export interface AnalyzingStep {
  label: string;
  /** progress % at which this step is considered complete */
  threshold: number;
}

interface AnalyzingScreenProps {
  /** 0–100 */
  progress: number;
  heading: string;
  /** live status line under the heading */
  message: string;
  steps: AnalyzingStep[];
  footer: string;
}

/**
 * The animated "analyzing your CV" loading view. Shared by the authenticated
 * analysis page and the public /try flow so both stay visually identical.
 * Callers provide their own centering wrapper (full-screen vs. in-page).
 */
export function AnalyzingScreen({ progress, heading, message, steps, footer }: AnalyzingScreenProps) {
  return (
    <div className="w-full max-w-sm">
      {/* Animated ring */}
      <div className="flex justify-center mb-8">
        <div className="relative w-20 h-20">
          {/* `stroke` is an SVG presentation attribute, so a `dark:` class can
              never reach it - a hardcoded hex here is invisible to the theme.
              Both circles used to be literals (#EAEAEA track, #111111 progress),
              which inverted the ring in dark mode: the empty track rendered
              near-white on the #111110 page while the filled arc rendered
              near-black, so progress read as a dark gap eating a bright ring.
              currentColor + the theme tokens is the same idiom ScoreRing uses. */}
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r="34" fill="none" strokeWidth="6"
              stroke="currentColor"
              className="text-[var(--color-card-border)]"
            />
            <circle
              cx="40" cy="40" r="34" fill="none" strokeWidth="6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeDasharray="213.6"
              strokeDashoffset={213.6 - (213.6 * Math.min(progress, 100)) / 100}
              className="text-[var(--color-foreground)] transition-all duration-300 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-black text-[#111111] dark:text-[#e8e7e4] stat-number">{Math.floor(progress)}%</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <h2 className="font-sans text-2xl tracking-tight text-[#111111] dark:text-[#e8e7e4] mb-2">{heading}</h2>
        <p className="text-[#6B6A65] dark:text-[#908d89] text-sm font-medium mb-6 min-h-[20px]">{message}</p>

        {/* Step indicators */}
        <div className="space-y-3 text-left mb-6">
          {steps.map((step) => (
            <div key={step.label} className="flex items-center gap-3">
              {/* Same theme blindness the ring had: #EAEAEA pending dots render
                  brighter on the dark page than the #346538 "done" ones, so the
                  list reads backwards. These tokens already flip per theme. */}
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                progress >= step.threshold
                  ? 'bg-[var(--color-success)]'
                  : progress >= step.threshold - 15
                  ? 'bg-[var(--color-warning)] animate-pulse'
                  : 'bg-[var(--color-card-border)] border border-[var(--color-muted-foreground)]'
              }`}>
                {progress >= step.threshold && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-xs font-medium transition-colors ${
                progress >= step.threshold
                  ? 'text-[var(--color-success)]'
                  : progress >= step.threshold - 15
                  ? 'text-[var(--color-warning)]'
                  : 'text-[var(--color-muted-foreground)]'
              }`}>{step.label}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#BDBDBD] dark:text-[#6a6764] leading-relaxed">
          {footer}
        </p>
      </div>
    </div>
  );
}
