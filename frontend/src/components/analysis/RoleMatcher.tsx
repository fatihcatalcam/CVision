import { Briefcase } from 'lucide-react';

interface CareerRecommendation {
  role_title: string;
  match_score: number;
  explanation: string;
}

interface RoleMatcherProps {
  recommendations: CareerRecommendation[];
}

export function RoleMatcher({ recommendations }: RoleMatcherProps) {
  if (!recommendations || recommendations.length === 0) {
    return <p className="text-[var(--color-muted)] text-sm mb-4">No matching roles found in the database.</p>;
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
          <div key={`${rec.role_title}-${index}`} className="flex flex-col gap-2 p-4 rounded-xl bg-zinc-900 border border-[var(--color-card-border)]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[var(--color-primary)]" />
                <h4 className="font-semibold text-white">{rec.role_title}</h4>
              </div>
              <span className="text-sm font-bold text-white">{scorePercentage}% Match</span>
            </div>
            
            {/* Progress Bar Container */}
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
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
