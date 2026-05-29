import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { MatchResponse, GapItem } from '../../services/matchApi';

interface MatchResultCardProps {
  match: MatchResponse;
  onGenerateCoverLetter?: () => void;
  isGeneratingCoverLetter?: boolean;
}

function scoreColor(score: number): string {
  if (score >= 70) return 'var(--color-success)';
  if (score >= 40) return 'var(--color-warning)';
  return 'var(--color-error)';
}

function scoreBg(score: number): string {
  if (score >= 70) return 'var(--color-success-bg)';
  if (score >= 40) return 'var(--color-warning-bg)';
  return 'var(--color-error-bg)';
}

const PRIORITY_COLOR: Record<string, string> = {
  high: '#9F2F2D',
  medium: '#956400',
  low: '#346538',
};

function GapCard({ gap }: { gap: GapItem }) {
  const [open, setOpen] = useState(false);
  const color = PRIORITY_COLOR[gap.priority] || 'var(--color-muted)';
  return (
    <div className="border rounded-[var(--radius-md)] overflow-hidden" style={{ borderColor: 'var(--color-card-border)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-[#F7F7F5] dark:hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-start gap-2 min-w-0 pr-1">
          <span className="text-[10px] font-bold uppercase flex-shrink-0 mt-0.5" style={{ color }}>{gap.priority}</span>
          <span className="text-sm leading-snug" style={{ color: 'var(--color-foreground)' }}>{gap.description}</span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-muted)' }} />
          : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-muted)' }} />}
      </button>
      {open && (
        <div className="px-3 pb-3 text-sm leading-relaxed" style={{ color: 'var(--color-muted)', background: 'var(--color-background)' }}>
          {gap.suggestion}
        </div>
      )}
    </div>
  );
}

export function MatchResultCard({ match, onGenerateCoverLetter, isGeneratingCoverLetter }: MatchResultCardProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{ background: scoreBg(match.match_score), color: scoreColor(match.match_score) }}
        >
          {match.match_score}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-muted)' }}>
            {t('match.matchScore')}
          </p>
          {match.summary && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-foreground)' }}>{match.summary}</p>
          )}
        </div>
      </div>

      {/* Keywords */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {match.matched_keywords.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: 'var(--color-success)' }}>
              <CheckCircle className="w-3.5 h-3.5" /> {t('match.matchedKeywords')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {match.matched_keywords.map(kw => (
                <span key={kw} className="px-2 py-0.5 text-xs rounded-full" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
        {match.missing_keywords.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: 'var(--color-error)' }}>
              <XCircle className="w-3.5 h-3.5" /> {t('match.missingKeywords')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {match.missing_keywords.map(kw => (
                <span key={kw} className="px-2 py-0.5 text-xs rounded-full" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gap Analysis */}
      {match.gap_analysis.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-muted)' }}>
            {t('match.gapAnalysis')}
          </p>
          <div className="space-y-2">
            {match.gap_analysis.map((gap, i) => <GapCard key={i} gap={gap} />)}
          </div>
        </div>
      )}

      {/* Cover Letter CTA */}
      {onGenerateCoverLetter && (
        <button
          onClick={onGenerateCoverLetter}
          disabled={isGeneratingCoverLetter}
          className="w-full py-2.5 text-sm font-medium rounded-[var(--radius-md)] border transition-colors hover:bg-[#F7F7F5] dark:hover:bg-white/[0.04] disabled:opacity-50"
          style={{ borderColor: 'var(--color-card-border)', color: 'var(--color-foreground)' }}
        >
          {isGeneratingCoverLetter ? t('match.generating') : t('match.generateCoverLetter')}
        </button>
      )}
    </div>
  );
}
