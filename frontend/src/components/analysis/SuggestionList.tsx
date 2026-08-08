
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface Suggestion {
  id: number;
  category: string;
  message: string;
  snippets?: string[];
}

interface SuggestionListProps {
  suggestions: Suggestion[];
  activeSuggestionId?: number | null;
  onSelectSuggestion?: (suggestion: Suggestion) => void;
}

export function SuggestionList({ suggestions, activeSuggestionId, onSelectSuggestion }: SuggestionListProps) {
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
          icon: <CheckCircle className="w-5 h-5 text-[#346538]" />,
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
        const hasSnippets = suggestion.snippets && suggestion.snippets.length > 0;
        const isActive = activeSuggestionId === suggestion.id;
        
        return (
          <button 
            key={suggestion.id}
            onClick={() => onSelectSuggestion && onSelectSuggestion(suggestion)}
            className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all duration-300 ${
              isActive 
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-[var(--color-primary)]' 
                : `${style} hover:bg-opacity-20`
            } ${hasSnippets ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-pointer'}`}
          >
            <div className="mt-0.5">{icon}</div>
            <div className="flex-1">
              {/* One colour pair for both states. It used to be white when
                  selected and #111111 otherwise, with no dark variant on
                  either - so each theme hid one of them: in dark mode the
                  unselected rows were #111111 text on a #111110 page, and in
                  light mode the selected row was white on a 10%-tint
                  background. Selection is already carried by the ring and
                  border; it does not need to repaint the text. */}
              <p className="text-sm leading-relaxed text-[#111111] dark:text-[#e8e7e4]">
                {suggestion.message}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B6A65] dark:text-[#908d89] bg-[#F1F1EF] dark:bg-white/[0.06] px-2 py-0.5 rounded">
                  {suggestion.category}
                </span>
                {hasSnippets && (
                  <span className="text-[10px] text-red-400 font-semibold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    Fix ({suggestion.snippets!.length})
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
