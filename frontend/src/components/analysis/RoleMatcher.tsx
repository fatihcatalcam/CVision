import { Briefcase, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CareerRecommendation {
  role_title: string;
  match_score: number;
  explanation: string;
}

interface RoleMatcherProps {
  recommendations: CareerRecommendation[];
}

export function RoleMatcher({ recommendations }: RoleMatcherProps) {
  const { t } = useTranslation();

  if (!recommendations || recommendations.length === 0) {
    // Honest empty state: weak matches are filtered server-side rather than
    // shown as absurd "career advice" (e.g. Mobile App Developer for a
    // cinema graduate off one stray keyword).
    return (
      <div className="flex items-start gap-2.5 p-4 rounded-xl bg-[#F7F6F3] dark:bg-[#1c1c1a] border border-[var(--color-card-border)] mb-4">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-[var(--color-muted)]" />
        <p className="text-[var(--color-muted)] text-sm leading-relaxed">{t('analysis.noRoleMatch')}</p>
      </div>
    );
  }

  // Sort by match score descending
  const sortedRoles = [...recommendations].sort((a, b) => b.match_score - a.match_score);

  return (
    <div className="space-y-4">
      {sortedRoles.map((rec, index) => {
        // Backend provides match_score natively out of 100 (e.g. 85.5)
        const scorePercentage = Math.round(rec.match_score);
        
        // Progress bar color based on match (0-100 scale)
        let barColor = 'bg-blue-500';
        if (scorePercentage >= 70) barColor = 'bg-emerald-500';
        else if (scorePercentage <= 40) barColor = 'bg-amber-500';

        return (
          <div key={`${rec.role_title}-${index}`} className="flex flex-col gap-2 p-4 rounded-xl bg-[#F7F6F3] dark:bg-[#1c1c1a] border border-[var(--color-card-border)]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[var(--color-primary)]" />
                <h4 className="font-semibold text-[#111111] dark:text-[#e8e7e4]">{rec.role_title}</h4>
              </div>
              <span className="text-sm font-bold text-[#111111] dark:text-[#e8e7e4]">{scorePercentage}% Match</span>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full h-2 bg-[#EAEAEA] dark:bg-white/[0.07] rounded-full overflow-hidden">
              <div 
                className={`h-full ${barColor} transition-all duration-1000 ease-out`} 
                style={{ width: `${Math.min(scorePercentage, 100)}%` }}
              />
            </div>

            {/* Explanation from backend Rec Engine */}
            <div className="mt-2 text-xs">
              <p className="text-[var(--color-muted)] leading-relaxed">
                {rec.explanation}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
