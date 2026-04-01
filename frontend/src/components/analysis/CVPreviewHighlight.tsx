import { useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import api from '../../services/api';

interface CVPreviewHighlightProps {
  cvId: number;
  extractedText: string;
  activeSnippets: string[];
}

export function CVPreviewHighlight({ cvId, extractedText, activeSnippets }: CVPreviewHighlightProps) {
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const handleViewPdf = async () => {
    try {
      setIsPdfLoading(true);
      const res = await api.get(`/cvs/${cvId}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error("Failed to view PDF", err);
      alert("Failed to load original PDF file.");
    } finally {
      setIsPdfLoading(false);
    }
  };
  // We need to find all occurrences of all activeSnippets in extractedText
  // and wrap them in a styled element.
  
  const highlightedElements = useMemo(() => {
    if (!extractedText) return <p className="text-zinc-500 italic">No text available to preview.</p>;
    if (!activeSnippets || activeSnippets.length === 0) {
      return <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-zinc-300">{extractedText}</div>;
    }

    // A simple, safe highlighter: escape regex strings
    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Sort snippets by length (longest first) to prevent partial matching bugs
    const sortedSnippets = [...activeSnippets].sort((a, b) => b.length - a.length);
    
    // Create a capturing group for all valid snippets
    const pattern = new RegExp(`(${sortedSnippets.map(escapeRegExp).join('|')})`, 'gi');
    
    const parts = extractedText.split(pattern);

    return (
      <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-zinc-300 transition-all duration-300">
        {parts.map((part, i) => {
          // Check if this part matches any of our active snippets (case-insensitive)
          const isMatch = sortedSnippets.some(
            snippet => snippet.toLowerCase() === part.toLowerCase()
          );

          if (isMatch) {
            return (
              <mark 
                key={i} 
                className="bg-red-500/20 text-red-200 border border-red-500/40 rounded px-1 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-500"
              >
                {part}
              </mark>
            );
          }
          return <span key={i} className="opacity-40 transition-opacity duration-300">{part}</span>;
        })}
      </div>
    );
  }, [extractedText, activeSnippets]);

  return (
    <Card className="h-full max-h-[800px] overflow-y-auto border-zinc-800 bg-[rgba(15,15,20,0.6)] backdrop-blur-md sticky top-6">
      <div className="border-b border-zinc-800 pb-4 mb-4 flex justify-between items-center sticky top-0 bg-[rgba(15,15,20,0.9)] z-20">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Live CV Preview
        </h3>
        <div className="flex items-center gap-3">
          {activeSnippets.length > 0 && (
            <span className="text-xs font-semibold px-2 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30">
              {activeSnippets.length} highlight{activeSnippets.length !== 1 ? 's' : ''} active
            </span>
          )}
          <button
            onClick={handleViewPdf}
            disabled={isPdfLoading}
            className="text-xs font-semibold px-3 py-1.5 rounded bg-[var(--color-primary)] text-white hover:bg-opacity-80 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isPdfLoading ? 'Loading...' : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View PDF
              </>
            )}
          </button>
        </div>
      </div>
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-[rgba(15,15,20,0.8)] z-10 h-16 bottom-0" />
        {highlightedElements}
      </div>
    </Card>
  );
}
