import { useNavigate } from 'react-router-dom';
import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
}: ScoreHeroCardProps) {
  const navigate = useNavigate();
  const rounded = Math.round(latestScore);

  const subMetrics = [
    { label: 'ATS', value: atsScore },
    { label: 'Keywords', value: keywordScore },
    { label: 'Completeness', value: completenessScore },
  ].filter((m): m is { label: string; value: number } => m.value !== null);

  return (
    <div className="surface p-6 flex flex-col gap-5">

      {/* ── Top section ── */}
      <p className="text-xs text-[#787774] dark:text-[#908d89] font-medium uppercase tracking-wider">
        Son Analiz{latestRoleTitle ? ` · ${latestRoleTitle}` : ''}
      </p>

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

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Bottom section ── */}
      <div className="border-t border-[#EAEAEA] dark:border-white/[0.07] pt-4 flex items-end justify-between">
        {/* Stats */}
        <div className="flex gap-6">
          <div>
            <p className="text-[10px] text-[#787774] dark:text-[#908d89] uppercase tracking-wider font-semibold">
              Toplam Analiz
            </p>
            <p className="text-base font-black text-[#111111] dark:text-[#e8e7e4] mt-0.5 stat-number">
              {totalAnalyses}
            </p>
          </div>
          {averageScore != null && (
            <div>
              <p className="text-[10px] text-[#787774] dark:text-[#908d89] uppercase tracking-wider font-semibold">
                Ortalama Skor
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
          Analizi Gör <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
