

interface ExtractedSkill {
  skill_name: string;
  skill_category: string;
  confidence_score: number;
}

interface SkillTagsProps {
  skills: ExtractedSkill[];
}

export function SkillTags({ skills }: SkillTagsProps) {
  if (!skills || skills.length === 0) {
    return <p className="text-[var(--color-muted)] text-sm">No skills identified.</p>;
  }

  // Sort by confidence score
  const sorted = [...skills].sort((a, b) => b.confidence_score - a.confidence_score);

  return (
    <div className="flex flex-wrap gap-2">
      {sorted.map((skill, index) => {
        let colorClasses = 'bg-[#F7F6F3] dark:bg-white/[0.05] text-[#111111] dark:text-[#e8e7e4] border-[#EAEAEA] dark:border-white/[0.07]'; // Low confidence
        if (skill.confidence_score >= 0.8) {
          colorClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/20'; // High confidence
        } else if (skill.confidence_score >= 0.5) {
          colorClasses = 'bg-[#EEF2F8] text-[#1B3A6B] border-[#C5D4E8]'; // Medium confidence
        }

        return (
          <span 
            key={`${skill.skill_name}-${index}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${colorClasses} animate-in fade-in transition-all hover:scale-105 cursor-default flex items-center gap-1.5`}
            title={`Confidence: ${(skill.confidence_score * 100).toFixed(0)}%`}
          >
            {skill.skill_name}
            {skill.confidence_score >= 0.9 && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
          </span>
        );
      })}
    </div>
  );
}
