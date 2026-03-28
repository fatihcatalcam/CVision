import React from 'react';
import { Briefcase } from 'lucide-react';

interface RoleRecommendation {
  id?: number;
  role_id: number;
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  role?: {
    title: string;
    description: string;
  };
}

interface RoleMatcherProps {
  recommendations: RoleRecommendation[];
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
        // Safe access to the nested role data
        const roleTitle = rec.role?.title || `Role #${rec.role_id}`;
        const scorePercentage = (rec.match_score * 100).toFixed(0);
        
        // Progress bar color based on match
        let barColor = 'bg-blue-500';
        if (rec.match_score >= 0.8) barColor = 'bg-emerald-500';
        else if (rec.match_score <= 0.4) barColor = 'bg-amber-500';

        return (
          <div key={index} className="flex flex-col gap-2 p-4 rounded-xl bg-zinc-900 border border-[var(--color-card-border)]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[var(--color-primary)]" />
                <h4 className="font-semibold text-white">{roleTitle}</h4>
              </div>
              <span className="text-sm font-bold text-white">{scorePercentage}% Match</span>
            </div>
            
            {/* Progress Bar Container */}
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${barColor} transition-all duration-1000 ease-out`} 
                style={{ width: `${scorePercentage}%` }}
              />
            </div>

            {/* Skill Breakdown */}
            <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-emerald-400 font-medium">Matching Skills ({rec.matching_skills?.length || 0})</span>
                <p className="text-zinc-400 truncate mt-0.5">
                  {rec.matching_skills?.join(', ') || 'None'}
                </p>
              </div>
              <div>
                <span className="text-amber-400 font-medium">Missing Skills ({rec.missing_skills?.length || 0})</span>
                <p className="text-zinc-400 truncate mt-0.5" title={rec.missing_skills?.join(', ')}>
                  {rec.missing_skills?.join(', ') || 'None'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
