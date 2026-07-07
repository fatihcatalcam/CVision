import { useTranslation } from 'react-i18next';
import { FileText, Sparkles } from 'lucide-react';

const SCORE = 78;
const RING_R = 26;
const RING_C = 2 * Math.PI * RING_R;

const BARS = [
  { labelKey: 'scoreHero.ats', value: 82 },
  { labelKey: 'scoreHero.keywords', value: 71 },
  { labelKey: 'scoreHero.completeness', value: 80 },
];

function barColor(value: number) {
  if (value >= 75) return '#346538';
  return '#956400';
}

export function HeroMockup() {
  const { t } = useTranslation();

  return (
    <div className="relative select-none" aria-hidden="true">
      {/* Soft glow behind the card */}
      <div
        className="absolute -inset-6 rounded-[32px] opacity-60 blur-2xl"
        style={{ background: 'radial-gradient(ellipse at 30% 20%, var(--color-accent), transparent 65%)' }}
      />

      <div className="relative rounded-2xl border border-[#EAEAEA] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1a] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)] p-6 lg:rotate-1 transition-transform lg:hover:rotate-0 duration-300">

        {/* Header: file + score ring */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--color-accent)' }}>
              <FileText className="w-4 h-4" style={{ color: 'var(--color-primary)' }} strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#111111] dark:text-[#e8e7e4] truncate">cv_final_v3.pdf</p>
              <p className="text-[10px] text-[#A09D9A]">PDF · 214 KB</p>
            </div>
          </div>

          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
              <circle cx="32" cy="32" r={RING_R} fill="none" strokeWidth="5" className="stroke-[#F0EFEC] dark:stroke-white/[0.08]" />
              <circle
                cx="32" cy="32" r={RING_R} fill="none" strokeWidth="5" strokeLinecap="round"
                stroke="#346538"
                strokeDasharray={`${(SCORE / 100) * RING_C} ${RING_C}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="stat-number text-lg font-bold leading-none text-[#111111] dark:text-[#e8e7e4]">{SCORE}</span>
              <span className="text-[8px] font-semibold tracking-wider text-[#A09D9A]">/100</span>
            </div>
          </div>
        </div>

        {/* Sub-score bars */}
        <div className="space-y-2.5 mb-5">
          {BARS.map(({ labelKey, value }) => (
            <div key={labelKey} className="flex items-center gap-2.5">
              <span className="w-24 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#787774] dark:text-[#908d89] truncate">
                {t(labelKey)}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-[#F0EFEC] dark:bg-white/[0.08] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${value}%`, background: barColor(value) }} />
              </div>
              <span className="w-6 text-right stat-number text-[11px] font-semibold text-[#111111] dark:text-[#e8e7e4]">{value}</span>
            </div>
          ))}
        </div>

        {/* Missing keywords */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#787774] dark:text-[#908d89] mb-2">
            {t('home.heroMockup.missing')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {['Docker', 'Kubernetes', 'CI/CD'].map((kw) => (
              <span key={kw} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400">
                {kw}
              </span>
            ))}
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium text-[#A09D9A] border border-dashed border-[#D5D3CF] dark:border-white/[0.12]">
              +3
            </span>
          </div>
        </div>

        {/* AI rewrite line */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-[#EDF3EC] dark:bg-[#346538]/20">
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#346538] dark:text-[#8fc79a]" />
          <span className="text-[11px] font-medium text-[#346538] dark:text-[#8fc79a]">
            {t('home.heroMockup.rewrite')}
          </span>
        </div>

      </div>
    </div>
  );
}
