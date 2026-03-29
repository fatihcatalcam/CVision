
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface Suggestion {
  id: number;
  category: string;
  message: string;
}

interface SuggestionListProps {
  suggestions: Suggestion[];
}

export function SuggestionList({ suggestions }: SuggestionListProps) {
  if (!suggestions || suggestions.length === 0) {
    return <p className="text-[var(--color-muted)] text-sm">No suggestions found.</p>;
  }

  const getIconAndStyle = (category: string) => {
    switch (category.toLowerCase()) {
      case 'critical':
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-400" />,
          style: 'border-red-500/20 bg-red-500/5',
        };
      case 'success':
      case 'good':
        return {
          icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
          style: 'border-emerald-500/20 bg-emerald-500/5',
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
          style: 'border-amber-500/20 bg-amber-500/5',
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-blue-400" />,
          style: 'border-blue-500/20 bg-blue-500/5',
        };
    }
  };

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion) => {
        const { icon, style } = getIconAndStyle(suggestion.category);
        return (
          <div 
            key={suggestion.id}
            className={`flex items-start gap-3 p-4 rounded-xl border ${style} transition-colors hover:bg-opacity-20`}
          >
            <div className="mt-0.5">{icon}</div>
            <div>
              <p className="text-white text-sm leading-relaxed">{suggestion.message}</p>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 mt-1 block">
                {suggestion.category}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
