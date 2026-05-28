import { Lightbulb } from 'lucide-react';

interface NextStepCardProps {
  suggestion: string;
}

export function NextStepCard({ suggestion }: NextStepCardProps) {
  return (
    <div className="surface p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10">
          <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <span className="text-xs font-semibold text-[#787774] dark:text-[#908d89] uppercase tracking-wider">
          Sıradaki Adım
        </span>
      </div>
      <p className="text-sm text-[#111111] dark:text-[#e8e7e4] leading-relaxed">
        {suggestion}
      </p>
    </div>
  );
}
