import { Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CareerInsightCardProps {
  roleTitle: string;
  matchScore: number;
}

export function CareerInsightCard({ roleTitle, matchScore }: CareerInsightCardProps) {
  const { t } = useTranslation();
  const rounded = Math.round(matchScore);
  const barColor =
    rounded >= 80 ? 'bg-[#346538]' : rounded >= 60 ? 'bg-amber-500' : 'bg-[#1B3A6B]';

  return (
    <div className="surface p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-[#EEF2F8] dark:bg-[#1B3A6B]/20">
          <Target className="w-3.5 h-3.5 text-[#1B3A6B] dark:text-[#4a7dd1]" />
        </div>
        <span className="text-xs font-semibold text-[#787774] dark:text-[#908d89] uppercase tracking-wider">
          {t('careerInsight.label')}
        </span>
      </div>

      <div>
        <p className="font-semibold text-[#111111] dark:text-[#e8e7e4] text-sm leading-snug">
          {roleTitle}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1.5 bg-[#EAEAEA] dark:bg-white/[0.07] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${barColor} transition-all duration-700`}
              style={{ width: `${rounded}%` }}
            />
          </div>
          <span className="text-xs font-bold text-[#111111] dark:text-[#e8e7e4]">
            {rounded}%
          </span>
        </div>
      </div>
    </div>
  );
}
