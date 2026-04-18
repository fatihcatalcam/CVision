import { useEffect, useState } from 'react';
import { X, Activity, Target, CheckCircle2, FileText } from 'lucide-react';
import { Card } from '../ui/Card';
import api from '../../services/api';
import { ScoreRing } from '../analysis/ScoreRing';

interface AdminAnalysisViewerProps {
  analysisId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminAnalysisViewer({ analysisId, isOpen, onClose }: AdminAnalysisViewerProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    let cancelled = false;
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/hq-portal/analyses/${analysisId}`);
        if (!cancelled) setData(res.data);
      } catch (err) {
        console.error('Failed to load full analysis details', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    fetchAnalysis();
    
    return () => {
      cancelled = true;
      document.body.style.overflow = '';
    };
  }, [analysisId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Sliding Panel */}
      <div className="relative z-10 w-full max-w-2xl h-full bg-[#0c0c10] border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-[rgba(255,255,255,0.02)] shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Analysis Report Preview
            </h2>
            <p className="text-zinc-500 text-sm mt-1">Detailed view of user's CV processing results</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10">
            <div className="w-12 h-12 border-[3px] border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="text-zinc-400 font-medium">Loading analysis engine results...</p>
          </div>
        ) : !data ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10">
            <p className="text-red-400 font-medium">Failed to load data.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Top Stats */}
            <div className="flex items-start gap-8">
              <div className="shrink-0 w-32">
                <ScoreRing score={data.scores.overall_score} label="Overall Match" size={120} />
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                    <p className="text-xs text-zinc-500 uppercase font-semibold">ATS Score</p>
                    <p className="text-lg text-white font-bold mt-1">{data.scores.ats_score}%</p>
                  </div>
                  <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                    <p className="text-xs text-zinc-500 uppercase font-semibold">Keywords</p>
                    <p className="text-lg text-white font-bold mt-1">{data.scores.keyword_score}%</p>
                  </div>
                  <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                    <p className="text-xs text-zinc-500 uppercase font-semibold">Completeness</p>
                    <p className="text-lg text-white font-bold mt-1">{data.scores.completeness_score}%</p>
                  </div>
                  <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                    <p className="text-xs text-zinc-500 uppercase font-semibold">Impact</p>
                    <p className="text-lg text-white font-bold mt-1">{data.scores.experience_score}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <section className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" /> Executive Summary
              </h3>
              <div className="p-4 bg-[rgba(255,255,255,0.03)] rounded-xl border border-zinc-800">
                <p className="text-zinc-300 text-sm leading-relaxed">{data.summary}</p>
              </div>
            </section>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card noPadding className="border-emerald-500/20 bg-emerald-500/5">
                <div className="px-4 py-3 border-b border-emerald-500/20 bg-emerald-500/10">
                  <h4 className="text-sm font-bold text-emerald-400">Key Strengths</h4>
                </div>
                <ul className="p-4 space-y-2">
                  {data.strengths.map((item: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card noPadding className="border-red-500/20 bg-red-500/5">
                <div className="px-4 py-3 border-b border-red-500/20 bg-red-500/10">
                  <h4 className="text-sm font-bold text-red-400">Areas for Improvement</h4>
                </div>
                <ul className="p-4 space-y-2">
                  {data.weaknesses.map((item: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-zinc-300">
                      <X className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Suggestions Overview */}
            <section className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" /> Actionable Suggestions ({data.suggestions.length})
              </h3>
              <div className="space-y-2">
                {data.suggestions.map((s: any) => (
                  <div key={s.id} className="p-3 bg-[rgba(255,255,255,0.02)] border border-zinc-800 rounded-lg flex items-start gap-3">
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                      s.priority === 'high' ? 'bg-red-500' : 
                      s.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <span className="text-xs font-semibold text-zinc-500 uppercase">{s.category}</span>
                      <p className="text-sm text-white mt-0.5 leading-snug">{s.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
          </div>
        )}
      </div>
    </div>
  );
}
