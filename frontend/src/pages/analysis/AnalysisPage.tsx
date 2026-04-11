import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Zap, FileText,
  Sparkles, ArrowRight, ChevronDown, ChevronUp, Copy, Check, Lock,
} from 'lucide-react';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { ScoreRing } from '../../components/analysis/ScoreRing';
import { SkillTags } from '../../components/analysis/SkillTags';
import { SuggestionList } from '../../components/analysis/SuggestionList';
import { RoleMatcher } from '../../components/analysis/RoleMatcher';
import { PDFViewerModal } from '../../components/analysis/PDFViewerModal';

// ─── Types ─────────────────────────────────────────────────────────────────

interface AISuggestion {
  category: string;
  priority: string;
  message: string | null;
  rewrite_hint: string | null;
  is_locked: boolean;
}

interface AnalysisData {
  id: number;
  cv_id: number;
  scores: {
    overall_score: number;
    ats_score: number;
    keyword_score: number;
    completeness_score: number;
    experience_score: number;
  };
  summary: string | null;
  strengths: string[];
  weaknesses: string[];
  extracted_text: string | null;
  suggestions: any[];
  extracted_skills: any[];
  career_recommendations?: any[];
  ai_summary: string | null;
  is_summary_locked: boolean;
  ai_suggestions: AISuggestion[];
  ai_enhanced: boolean;
}

// ─── Priority styles ────────────────────────────────────────────────────────

const PRIORITY_META: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  high:   { dot: 'bg-red-500',   bg: 'bg-red-500/10',   text: 'text-red-400',   label: 'High Priority' },
  medium: { dot: 'bg-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Medium' },
  low:    { dot: 'bg-blue-500',  bg: 'bg-blue-500/10',  text: 'text-blue-400',  label: 'Low' },
};

// ─── AI Suggestion Card ─────────────────────────────────────────────────────

function AISuggestionCard({ suggestion, index }: { suggestion: AISuggestion; index: number }) {
  if (suggestion.is_locked) {
    return (
      <div className="border border-zinc-800 rounded-xl overflow-hidden relative">
        <div className="w-full flex items-start gap-3 p-4 text-left opacity-30 blur-[2px] pointer-events-none select-none">
          <div className="mt-1.5 w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">Hidden Insight</span>
            </div>
            <p className="text-sm text-zinc-200">This premium suggestion contains advanced feedback about your experience section, identifying key areas for improvement.</p>
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/40">
           <div className="p-2 mb-2 bg-indigo-500/20 rounded-full">
             <Lock className="w-5 h-5 text-indigo-400" />
           </div>
           <p className="text-xs font-semibold text-white">Premium Feature</p>
        </div>
      </div>
    );
  }

  const [expanded, setExpanded] = useState(index === 0);
  const [copied, setCopied] = useState(false);
  const meta = PRIORITY_META[suggestion.priority] ?? PRIORITY_META.medium;

  const hint = suggestion.rewrite_hint?.trim() ?? '';
  const hasRewrite = hint.length > 5;

  // Parse "Before: X → After: Y"
  const beforeMatch = hint.match(/before[:\s]+(.+?)(?=→|after:|$)/i);
  const afterMatch  = hint.match(/(?:→|after[:\s]+)(.+)/i);
  const beforeText  = beforeMatch?.[1]?.trim() ?? '';
  const afterText   = afterMatch?.[1]?.trim()  ?? hint;

  const handleCopy = () => {
    navigator.clipboard.writeText(afterText || hint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${expanded ? 'border-indigo-500/30' : 'border-zinc-800'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-zinc-800/40 transition-colors"
      >
        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
              {meta.label}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-2 py-0.5 rounded-full bg-zinc-800">
              {suggestion.category}
            </span>
            {hasRewrite && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-500/10 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Rewrite Available
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-200 leading-snug">{suggestion.message}</p>
        </div>
        {expanded
          ? <ChevronUp   className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-1" />
          : <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-1" />}
      </button>

      {expanded && hasRewrite && (
        <div className="border-t border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          {beforeText ? (
            <>
              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-red-400 mb-1">✗ Before (Current)</p>
                <p className="text-sm text-zinc-300 italic">"{beforeText}"</p>
              </div>
              <div className="flex justify-center">
                <ArrowRight className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> After (AI Rewrite)
                  </p>
                  <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition-colors">
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-sm text-zinc-200">"{afterText}"</p>
              </div>
            </>
          ) : (
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Suggestion
                </p>
                <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition-colors">
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-sm text-zinc-200">{hint}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('Initializing AI Pipeline...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<any | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'classic'>('ai');

  // Animated progress bar
  useEffect(() => {
    if (data || error) return;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev < 30) return prev + 2;
        if (prev < 60) return prev + 1;
        if (prev < 90) return prev + 0.5;
        if (prev < 95) return prev + 0.1;
        return prev;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [data, error]);

  // Poll analysis status
  useEffect(() => {
    let active = true;

    const poll = async () => {
      const startTime = Date.now();
      const timeout = 60000;

      const check = async () => {
        if (!active) return;
        if (Date.now() - startTime > timeout) {
          if (active) setError('Analysis timed out after 60 seconds.');
          return;
        }
        try {
          const { data: status } = await api.get(`/analysis/${id}/status`);

          if (status.status === 'failed') {
            if (active) setError(status.error_message || 'Analysis failed.');
            return;
          }
          if (status.status === 'completed') {
            setLoadingMsg('Generating AI recommendations...');
            setProgress(99);
            try {
              const { data: result } = await api.get(`/analysis/${id}/results`);
              if (active) { setData(result); setProgress(100); }
            } catch {
              if (active) setError('Failed to retrieve results.');
            }
            return;
          }
          if (status.status === 'pending')    setLoadingMsg('Waiting in queue...');
          if (status.status === 'processing') setLoadingMsg('Analyzing CV with AI… this takes 15–30 s');
          setTimeout(check, 2000);
        } catch (err: any) {
          if (err.response?.status === 404) { if (active) setError('CV not found.'); }
          else setTimeout(check, 3000);
        }
      };
      check();
    };

    if (id && !data && !error) poll();
    return () => { active = false; };
  }, [id, data, error]);

  // ── Loading screen ──
  if (!data && !error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Animated ring */}
          <div className="flex justify-center mb-8">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#1e1e2e" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="34" fill="none" stroke="url(#grad)" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="213.6"
                  strokeDashoffset={213.6 - (213.6 * Math.min(progress, 100)) / 100}
                  className="transition-all duration-300 ease-out"
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-white stat-number">{Math.floor(progress)}%</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-black text-white mb-2">Analyzing Your CV</h2>
            <p className="text-indigo-400 text-sm font-medium mb-6 min-h-[20px]">{loadingMsg}</p>

            {/* Step indicators */}
            <div className="space-y-3 text-left mb-6">
              {[
                { label: 'Parsing document structure', threshold: 20 },
                { label: 'Extracting skills & experience', threshold: 45 },
                { label: 'Running AI analysis engine', threshold: 70 },
                { label: 'Generating personalized feedback', threshold: 90 },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                    progress >= step.threshold
                      ? 'bg-emerald-500'
                      : progress >= step.threshold - 15
                      ? 'bg-indigo-500 animate-pulse'
                      : 'bg-zinc-800 border border-zinc-700'
                  }`}>
                    {progress >= step.threshold && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs font-medium transition-colors ${
                    progress >= step.threshold ? 'text-emerald-400' : progress >= step.threshold - 15 ? 'text-indigo-300' : 'text-zinc-600'
                  }`}>{step.label}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              AI is reading your CV and generating personalized insights. This typically takes 15–30 seconds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error screen ──
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="text-center max-w-lg">
          <div className="w-16 h-16 mx-auto bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mb-5">
            <Zap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Analysis Failed</h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all text-sm font-medium mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </button>
        </Card>
      </div>
    );
  }

  const modalSnippets = (activeSuggestion?.snippets ?? []).map((s: string) => ({
    text: s,
    priority: activeSuggestion?.priority ?? 'medium',
  }));

  const hasAI = data!.ai_enhanced && data!.ai_suggestions.length > 0;

  return (
    <>
      <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-500 delay-150">

        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-sm font-medium text-[var(--color-muted)] hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white">Analysis Report</h1>
              {data!.ai_enhanced && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> AI Enhanced
                </span>
              )}
            </div>
            <p className="text-[var(--color-muted)] text-sm">Report #{data!.id} • Processed by CVision AI</p>
          </div>
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            <FileText className="w-4 h-4" />
            View Original CV
          </button>
        </div>

        <div className="space-y-8">

          {/* Scores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="flex flex-col items-center justify-center py-8">
              <ScoreRing score={Math.round(data!.scores.overall_score)} label="Overall Score" colorClass="" />
            </Card>
            <Card className="flex flex-col items-center justify-center py-8">
              <ScoreRing score={Math.round(data!.scores.ats_score)} label="ATS Compatibility" colorClass="text-[#3b82f6]" />
            </Card>
            <Card className="flex flex-col items-center justify-center py-8">
              <ScoreRing score={Math.round(data!.scores.keyword_score)} label="Keyword Relevance" colorClass="text-[#8b5cf6]" />
            </Card>
          </div>

          {/* AI Executive Summary */}
          {data!.ai_summary && (
            <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">AI Executive Summary</h3>
              </div>
              <p className={`text-zinc-200 leading-relaxed text-[15px] ${data!.is_summary_locked ? 'blur-[3px] opacity-60 select-none pointer-events-none' : ''}`}>
                {data!.ai_summary}
              </p>
              {data!.is_summary_locked && (
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-card-bg)] via-[var(--color-card-bg)]/60 to-transparent flex items-center justify-center">
                  <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 border border-indigo-500/50 text-white shadow-xl shadow-indigo-500/20 text-sm font-bold hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all">
                    <Lock className="w-4 h-4" /> Unlock Full AI Report
                  </button>
                </div>
              )}
            </Card>
          )}

          {/* Strengths & Weaknesses */}
          {(data!.strengths.length > 0 || data!.weaknesses.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card noPadding className="border-emerald-500/20 overflow-hidden">
                <div className="px-5 py-4 border-b border-emerald-500/20 bg-emerald-500/5">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Key Strengths</h3>
                </div>
                <ul className="p-5 space-y-2.5">
                  {data!.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-200">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card noPadding className="border-red-500/20 overflow-hidden">
                <div className="px-5 py-4 border-b border-red-500/20 bg-red-500/5">
                  <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">Areas to Improve</h3>
                </div>
                <ul className="p-5 space-y-2.5">
                  {data!.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-200">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}

          {/* Suggestions with tab switcher */}
          <Card>
            <div className="flex items-center gap-1 mb-6 border-b border-zinc-800 pb-4">
              {hasAI && (
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'ai'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Suggestions
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                    {data!.ai_suggestions.length}
                  </span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('classic')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'classic'
                    ? 'bg-zinc-700 text-white border border-zinc-600'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Rule-Based Fixes
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700 text-zinc-300 font-bold">
                  {data!.suggestions.length}
                </span>
              </button>
            </div>

            {activeTab === 'ai' && hasAI && (
              <div className="space-y-3">
                {data!.ai_suggestions.map((s, i) => (
                  <AISuggestionCard key={i} suggestion={s} index={i} />
                ))}
              </div>
            )}

            {activeTab === 'classic' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-[var(--color-muted)]">
                    Click an issue to select it, then press "View in CV" to see highlighted problems.
                  </p>
                  {activeSuggestion?.snippets?.length > 0 && (
                    <button
                      onClick={() => setIsPdfModalOpen(true)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 transition-all flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View in CV ({activeSuggestion.snippets.length} highlight{activeSuggestion.snippets.length !== 1 ? 's' : ''})
                    </button>
                  )}
                </div>
                <SuggestionList
                  suggestions={data!.suggestions}
                  activeSuggestionId={activeSuggestion?.id}
                  onSelectSuggestion={(s) => setActiveSuggestion(activeSuggestion?.id === s.id ? null : s)}
                />
              </>
            )}
          </Card>

          {/* Career Matches & Skills */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card noPadding className="overflow-hidden">
              <div className="p-6 border-b border-[var(--color-card-border)] bg-[rgba(255,255,255,0.02)]">
                <h3 className="text-lg font-bold text-white">Career Profile Matches</h3>
                <p className="text-sm text-[var(--color-muted)] mt-1">Comparing extracted skills against our role database</p>
              </div>
              <div className="p-6">
                <RoleMatcher recommendations={data!.career_recommendations ?? []} />
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-bold text-white mb-4">Extracted Skills</h3>
              <SkillTags skills={data!.extracted_skills} />
            </Card>
          </div>

        </div>
      </div>

      <PDFViewerModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        cvId={data!.cv_id}
        activeSnippets={modalSnippets}
      />
    </>
  );
}
