import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, TrendingUp, TrendingDown, Minus, Plus, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DashboardMatchModal } from '../match/DashboardMatchModal';
import { CoverLetterModal } from '../match/CoverLetterModal';
import { createCoverLetter, type MatchResponse } from '../../services/matchApi';

function scoreColor(score: number): string {
  if (score >= 80) return 'text-[#346538] dark:text-[#4ade80]';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
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
  cvs: Array<{ id: string; original_filename: string }>;
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
  cvs,
}: ScoreHeroCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const rounded = Math.round(latestScore);

  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null);
  const [matchJdId, setMatchJdId] = useState<string | null>(null);
  const [matchCvId, setMatchCvId] = useState<string | null>(null);
  const [coverLetterContent, setCoverLetterContent] = useState<string | null>(null);
  const [isGeneratingCl, setIsGeneratingCl] = useState(false);

  const handleGenerateCoverLetter = async () => {
    if (!matchCvId || !matchJdId) return;
    setIsGeneratingCl(true);
    try {
      const letter = await createCoverLetter(matchCvId, matchJdId);
      setCoverLetterContent(letter.content);
    } catch {
      // silent
    } finally {
      setIsGeneratingCl(false);
    }
  };

  const subMetrics = [
    { label: t('scoreHero.ats'), value: atsScore },
    { label: t('scoreHero.keywords'), value: keywordScore },
    { label: t('scoreHero.completeness'), value: completenessScore },
  ].filter((m): m is { label: string; value: number } => m.value !== null);

  return (
    <>
      <div className="surface p-6 flex flex-col gap-5">

        {/* ── Top section ── */}
        <div className="flex items-start justify-between">
          <p className="text-xs text-[#787774] dark:text-[#908d89] font-medium uppercase tracking-wider">
            {t('scoreHero.subtitle')}{latestRoleTitle ? ` · ${latestRoleTitle}` : ''}
          </p>
          <button
            onClick={onNewAnalysis}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] text-xs font-bold hover:bg-[#2a2a2a] dark:hover:bg-[#d0cfcc] active:scale-[0.97] transition-all flex-shrink-0 ml-3"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('dashboard.newAnalysis')}
          </button>
        </div>

        {/* Big score + delta */}
        <div className="flex items-end gap-4">
          <span className={`text-7xl font-black leading-none tracking-tight ${scoreColor(latestScore)}`}>
            {rounded}
            <span className="text-3xl font-bold text-[#787774] dark:text-[#908d89]">%</span>
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

        {/* ── Job Match section (replaces flex-1 spacer) ── */}
        <div className="relative rounded-xl border border-[#EAEAEA] dark:border-white/[0.07] overflow-hidden">
          {!isPremium ? (
            /* Free user — locked state */
            <>
              <div className="p-4 blur-sm pointer-events-none select-none opacity-40">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#787774] mb-1">{t('match.sectionLabel')}</p>
                <p className="text-sm text-[#787774]">{t('match.sectionDesc')}</p>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm bg-white/60 dark:bg-[#111110]/70 gap-2">
                <div className="p-1.5 bg-[#F1F1EF] dark:bg-white/[0.06] rounded-full">
                  <Lock className="w-4 h-4 text-[#787774] dark:text-[#908d89]" />
                </div>
                <p className="text-xs font-semibold text-[#111111] dark:text-[#e8e7e4]">{t('match.proGateTitle')}</p>
                <button
                  onClick={() => navigate('/pricing')}
                  className="px-3 py-1.5 bg-[#111111] text-white text-xs font-medium rounded-[var(--radius-md)] hover:bg-[#2a2a2a] transition-colors"
                >
                  {t('match.proGateButton')}
                </button>
              </div>
            </>
          ) : matchResult ? (
            /* Pro user — match result teaser */
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#787774]">{t('match.sectionLabel')}</p>
                <button
                  onClick={() => { setMatchResult(null); setMatchJdId(null); setMatchCvId(null); }}
                  className="text-[10px] text-[#787774] hover:text-[#111111] dark:hover:text-[#e8e7e4] underline transition-colors"
                >
                  {t('match.tryAnotherJD')}
                </button>
              </div>
              <div className="flex items-center gap-3">
                {/* Score badge */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
                  style={{
                    background: matchResult.match_score >= 70 ? 'var(--color-success-bg)' : matchResult.match_score >= 40 ? 'var(--color-warning-bg)' : 'var(--color-error-bg)',
                    color: matchResult.match_score >= 70 ? 'var(--color-success)' : matchResult.match_score >= 40 ? 'var(--color-warning)' : 'var(--color-error)',
                  }}
                >
                  {matchResult.match_score}
                </div>
                <div className="flex-1 min-w-0">
                  {matchResult.summary && (
                    <p className="text-xs text-[#787774] dark:text-[#908d89] leading-relaxed line-clamp-2">{matchResult.summary}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={isGeneratingCl}
                  className="flex-1 py-1.5 text-xs font-medium rounded-[var(--radius-md)] border border-[#EAEAEA] dark:border-white/[0.07] hover:bg-[#F7F7F5] dark:hover:bg-white/[0.04] disabled:opacity-50 transition-colors text-[#111111] dark:text-[#e8e7e4]"
                >
                  {isGeneratingCl ? t('match.generating') : t('match.generateCoverLetter')}
                </button>
                <button
                  onClick={() => navigate('/match')}
                  className="flex-1 py-1.5 text-xs font-medium rounded-[var(--radius-md)] bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] hover:bg-[#2a2a2a] dark:hover:bg-[#d0cfcc] transition-colors"
                >
                  {t('match.viewDetails')}
                </button>
              </div>
            </div>
          ) : (
            /* Pro user — CTA */
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#787774] mb-1">{t('match.sectionLabel')}</p>
              <p className="text-xs text-[#787774] dark:text-[#908d89] mb-3">{t('match.sectionDesc')}</p>
              <button
                onClick={() => setShowMatchModal(true)}
                className="px-4 py-2 bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] text-xs font-bold rounded-[var(--radius-md)] hover:bg-[#2a2a2a] dark:hover:bg-[#d0cfcc] transition-colors"
              >
                {t('match.openModal')}
              </button>
            </div>
          )}
        </div>

        {/* ── Bottom section ── */}
        <div className="border-t border-[#EAEAEA] dark:border-white/[0.07] pt-4 flex items-end justify-between">
          {/* Stats */}
          <div className="flex gap-6">
            <div>
              <p className="text-[10px] text-[#787774] dark:text-[#908d89] uppercase tracking-wider font-semibold">
                {t('scoreHero.totalAnalyses')}
              </p>
              <p className="text-base font-black text-[#111111] dark:text-[#e8e7e4] mt-0.5 stat-number">
                {totalAnalyses}
              </p>
            </div>
            {averageScore != null && (
              <div>
                <p className="text-[10px] text-[#787774] dark:text-[#908d89] uppercase tracking-wider font-semibold">
                  {t('scoreHero.averageScore')}
                </p>
                <p className={`text-base font-black mt-0.5 stat-number ${scoreColor(averageScore)}`}>
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

      {/* Modals */}
      {showMatchModal && (
        <DashboardMatchModal
          cvs={cvs}
          defaultCvId={latestCvId}
          onClose={() => setShowMatchModal(false)}
          onMatchComplete={(match, jdId, cvId) => {
            setMatchResult(match);
            setMatchJdId(jdId);
            setMatchCvId(cvId);
            setShowMatchModal(false);
          }}
        />
      )}
      {coverLetterContent && (
        <CoverLetterModal content={coverLetterContent} onClose={() => setCoverLetterContent(null)} />
      )}
    </>
  );
}
