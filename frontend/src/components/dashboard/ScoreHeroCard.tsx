import { useNavigate } from 'react-router-dom';
import { ChevronRight, TrendingUp, TrendingDown, Minus, Plus, Lock, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Aligned with semantic design tokens (success / warning / danger) for cross-component consistency
function scoreColor(score: number): string {
  if (score >= 80) return 'text-[#346538] dark:text-[#5a9b5e]';
  if (score >= 60) return 'text-[#956400] dark:text-[#c4890a]';
  return 'text-[#9F2F2D] dark:text-[#d4524f]';
}

interface ScoreHeroCardProps {
  latestScore: number;
  latestCvId: string;
  latestRoleTitle: string | null;
  scoreDelta: number | null;
  atsScore: number | null;
  keywordScore: number | null;
  completenessScore: number | null;
  totalAnalyses: number;
  averageScore: number | null;
  onNewAnalysis: () => void;
  isPremium: boolean;
}

export function ScoreHeroCard({
  latestScore,
  latestCvId,
  latestRoleTitle,
  scoreDelta,
  atsScore,
  keywordScore,
  completenessScore,
  totalAnalyses,
  averageScore,
  onNewAnalysis,
  isPremium,
}: ScoreHeroCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const rounded = Math.round(latestScore);

  const subMetrics = [
    { label: t('scoreHero.ats'), value: atsScore },
    { label: t('scoreHero.keywords'), value: keywordScore },
    { label: t('scoreHero.completeness'), value: completenessScore },
  ].filter((m): m is { label: string; value: number } => m.value !== null);

  return (
    <div className="surface p-6 flex flex-col gap-6">

      {/* Top section */}
      <div className="flex items-start justify-between">
        <p className="text-xs text-[#787774] dark:text-[#908d89] font-medium uppercase tracking-wider">
          {t('scoreHero.subtitle')}{latestRoleTitle ? ` · ${latestRoleTitle}` : ''}
        </p>
        <button
          onClick={onNewAnalysis}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] text-sm font-bold shadow-sm hover:bg-[#2a2a2a] dark:hover:bg-[#d0cfcc] active:scale-[0.97] transition-all flex-shrink-0 ml-3"
        >
          <Plus className="w-4 h-4" />
          {t('dashboard.newAnalysis')}
        </button>
      </div>

      {/* Big score + delta */}
      <div className="flex items-end gap-4">
        <span className={`text-7xl font-bold leading-none tracking-tight ${scoreColor(latestScore)}`}>
          {rounded}
          <span className="text-3xl font-semibold text-[#787774] dark:text-[#908d89]">%</span>
        </span>

        {scoreDelta !== null && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold mb-2 ${
            scoreDelta > 0
              ? 'bg-[#EDF3EC] dark:bg-[#346538]/15 text-[#346538] dark:text-[#4ade80]'
              : scoreDelta < 0
              ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
              : 'bg-[#F7F6F3] dark:bg-white/[0.05] text-[#787774] dark:text-[#908d89]'
          }`}>
            {scoreDelta > 0
              ? <TrendingUp className="w-3.5 h-3.5" />
              : scoreDelta < 0
              ? <TrendingDown className="w-3.5 h-3.5" />
              : <Minus className="w-3.5 h-3.5" />}
            {scoreDelta > 0 ? '+' : ''}{Math.round(scoreDelta)}
          </div>
        )}
      </div>

      {/* Sub-metric chips */}
      {subMetrics.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {subMetrics.map(({ label, value }) => (
            <div
              key={label}
              className="bg-[#F7F6F3] dark:bg-white/[0.03] rounded-xl p-3 border border-[#EAEAEA] dark:border-white/[0.05]"
            >
              <p className="text-[10px] text-[#787774] dark:text-[#908d89] uppercase font-semibold tracking-wider">
                {label}
              </p>
              <p className={`text-lg font-bold mt-0.5 ${scoreColor(value)}`}>
                {Math.round(value)}%
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Job Match section */}
      <div className="rounded-xl border border-[#EAEAEA] dark:border-white/[0.07]">
        <div className="p-4 bg-[#F7F6F3] dark:bg-white/[0.03]">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-1.5 bg-white dark:bg-white/[0.06] rounded-lg border border-[#EAEAEA] dark:border-white/[0.07] flex-shrink-0 mt-0.5">
              <Briefcase className="w-4 h-4 text-[#111111] dark:text-[#e8e7e4]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-[#e8e7e4] mb-0.5">{t('match.sectionLabel')}</p>
              <p className="text-xs text-[#787774] dark:text-[#908d89] leading-relaxed">{t('match.sectionDesc')}</p>
            </div>
          </div>
          {!isPremium ? (
            /* Free: locked button */
            <button
              onClick={() => navigate('/pricing')}
              className="w-full py-2 flex items-center justify-center gap-2 bg-[#F1F1EF] dark:bg-white/[0.05] text-[#787774] dark:text-[#908d89] text-xs font-semibold rounded-[var(--radius-md)] border border-[#EAEAEA] dark:border-white/[0.07] hover:bg-[#EAEAEA] dark:hover:bg-white/[0.08] transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              {t('match.proGateButton')}
            </button>
          ) : (
            /* Pro: active button */
            <button
              onClick={() => navigate('/match')}
              className="w-full py-2 bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] text-xs font-bold rounded-[var(--radius-md)] hover:bg-[#2a2a2a] dark:hover:bg-[#d0cfcc] active:scale-[0.98] transition-all"
            >
              {t('match.openModal')}
            </button>
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="border-t border-[#EAEAEA] dark:border-white/[0.07] pt-4 flex items-end justify-between">
        {/* Stats */}
        <div className="flex gap-6">
          <div>
            <p className="text-[10px] text-[#787774] dark:text-[#908d89] uppercase tracking-wider font-semibold">
              {t('scoreHero.totalAnalyses')}
            </p>
            <p className="text-base font-bold text-[#111111] dark:text-[#e8e7e4] mt-0.5 stat-number">
              {totalAnalyses}
            </p>
          </div>
          {averageScore != null && (
            <div>
              <p className="text-[10px] text-[#787774] dark:text-[#908d89] uppercase tracking-wider font-semibold">
                {t('scoreHero.averageScore')}
              </p>
              <p className={`text-base font-bold mt-0.5 stat-number ${scoreColor(averageScore)}`}>
                {Math.round(averageScore)}%
              </p>
            </div>
          )}
        </div>

        {/* Deep link */}
        <button
          onClick={() => navigate(`/analysis/${latestCvId}`)}
          className="flex items-center gap-1 text-sm font-medium text-[#1B3A6B] dark:text-[#4a7dd1] hover:underline"
        >
          {t('scoreHero.viewAnalysis')} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
