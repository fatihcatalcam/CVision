import { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';

interface Snippet {
  text: string;
  priority: 'high' | 'medium' | 'low';
}

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvId: number;
  activeSnippets: Snippet[];
}

export function PDFViewerModal({ isOpen, onClose, cvId, activeSnippets }: PDFViewerModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch PDF — if snippets exist, request the highlighted version
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const fetchPdf = async () => {
      setLoading(true);
      setError(null);

      // Clean up any previous URL
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }

      try {
        let res;
        const snippetTexts = activeSnippets.map(s => s.text);

        if (snippetTexts.length > 0) {
          // POST to get highlighted PDF
          res = await api.post(
            `/cvs/${cvId}/preview`,
            { snippets: snippetTexts },
            { responseType: 'blob' }
          );
        } else {
          // GET original PDF
          res = await api.get(`/cvs/${cvId}/download`, { responseType: 'blob' });
        }

        if (cancelled) return;
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        if (!cancelled) setError('Failed to load PDF file.');
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPdf();

    return () => {
      cancelled = true;
    };
  }, [isOpen, cvId, activeSnippets]);

  // Revoke URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) window.URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-[95vw] h-[92vh] max-w-[1400px] bg-[#0c0c10] border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[rgba(255,255,255,0.02)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Original CV Document</h2>
              <p className="text-zinc-500 text-xs">Press ESC or click outside to close</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeSnippets.length > 0 && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-300 text-xs font-semibold">
                  {activeSnippets.length} area{activeSnippets.length !== 1 ? 's' : ''} highlighted in red
                </span>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Modal Body — Full PDF */}
        <div className="flex-1 relative bg-[#1a1a1e]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-[3px] border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-zinc-400 text-sm">
                  {activeSnippets.length > 0 ? 'Generating highlighted PDF...' : 'Loading PDF...'}
                </span>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="CV PDF Viewer"
            />
          )}
        </div>
      </div>
    </div>
  );
}
