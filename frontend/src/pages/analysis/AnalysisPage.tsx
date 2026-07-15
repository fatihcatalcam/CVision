import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Zap, FileText,
  Sparkles, ArrowRight, ChevronDown, ChevronUp, Copy, Check, Lock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { ScoreRing } from '../../components/analysis/ScoreRing';
import { SkillTags } from '../../components/analysis/SkillTags';
import { SuggestionList } from '../../components/analysis/SuggestionList';
import { RoleMatcher } from '../../components/analysis/RoleMatcher';
import { PDFViewerModal } from '../../components/analysis/PDFViewerModal';
import { AtsXraySection, type LayoutXray } from '../../components/analysis/AtsXraySection';
import { AnalyzingScreen } from '../../components/analysis/AnalyzingScreen';
import { JDInputModal } from '../../components/match/JDInputModal';
import { MatchResultCard } from '../../components/match/MatchResultCard';
import { CoverLetterModal } from '../../components/match/CoverLetterModal';
import { createCoverLetter, type MatchResponse } from '../../services/matchApi';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface AISuggestion {
  category: string;
  priority: string;
  message: string | null;
  rewrite_hint: string | null;
  is_locked: boolean;
}

interface AnalysisData {
  id: string;
  cv_id: string;
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
  layout_xray?: LayoutXray | null;
}

// â”€â”€â”€ Priority styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PRIORITY_META: Record<string, { dot: string; bg: string; text: string; labelKey: string }> = {
  high:   { dot: 'bg-[#9F2F2D]', bg: 'bg-[#9F2F2D]/10', text: 'text-[#9F2F2D]', labelKey: 'analysis.priorityHigh' },
  medium: { dot: 'bg-[#956400]', bg: 'bg-[#956400]/10', text: 'text-[#956400]', labelKey: 'analysis.priorityMedium' },
  low:    { dot: 'bg-[#346538]', bg: 'bg-[#346538]/10', text: 'text-[#346538]', labelKey: 'analysis.priorityLow' },
};

// â”€â”€â”€ AI Suggestion Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function AISuggestionCard({ suggestion, index }: { suggestion: AISuggestion; index: number }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (suggestion.is_locked) {
    return (
      <div className="border border-[#EAEAEA] dark:border-white/[0.07] rounded-xl overflow-hidden relative min-h-[168px]">
        <div className="w-full flex items-start gap-3 p-4 text-left opacity-30 blur-[2px] pointer-events-none select-none">
          <div className="mt-1.5 w-2 h-2 rounded-full bg-[#787774] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#F1F1EF] dark:bg-white/[0.06] text-[#787774]">{t('match.lockedInsightBadge')}</span>
            </div>
            <p className="text-sm text-[#111111] dark:text-[#e8e7e4]">{t('match.lockedInsightDesc')}</p>
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-[#111110]/70 backdrop-blur-sm">
           <div className="p-2 mb-2 bg-[#F1F1EF] dark:bg-white/[0.06] dark:bg-white/[0.08] rounded-full">
             <Lock className="w-5 h-5 text-[#787774] dark:text-[#908d89]" />
           </div>
           <p className="text-xs font-semibold text-[#111111] dark:text-[#e8e7e4] mb-3">{t('match.proGateTitle')}</p>
           <button
             onClick={() => navigate('/pricing')}
             className="px-4 py-2 bg-[#111111] text-white text-sm font-medium rounded-[var(--radius-md)] hover:bg-[#2a2a2a] transition-colors"
           >
             {t('match.proGateButton')}
           </button>
        </div>
      </div>
    );
  }

  const [expanded, setExpanded] = useState(index === 0);
  const [copied, setCopied] = useState(false);
  const meta = PRIORITY_META[suggestion.priority] ?? PRIORITY_META.medium;

  const hint = suggestion.rewrite_hint?.trim() ?? '';
  const hasRewrite = hint.length > 5;

  // Parse "Before: X â†’ After: Y"
  const beforeMatch = hint.match(/before[:\s]+(.+?)(?=â†’|after:|$)/i);
  const afterMatch  = hint.match(/(?:â†’|after[:\s]+)(.+)/i);
  const beforeText  = beforeMatch?.[1]?.trim() ?? '';
  const afterText   = afterMatch?.[1]?.trim()  ?? hint;

  const handleCopy = () => {
    navigator.clipboard.writeText(afterText || hint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${expanded ? 'border-[#BDBDBD]' : 'border-[#EAEAEA]'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-[#F7F7F5] dark:bg-white/[0.03] dark:hover:bg-white/[0.04] transition-colors"
      >
        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
              {t(meta.labelKey)}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787774] px-2 py-0.5 rounded-full bg-[#F1F1EF] dark:bg-white/[0.06]">
              {suggestion.category}
            </span>
            {hasRewrite && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#787774] px-2 py-0.5 rounded-full bg-[#F1F1EF] dark:bg-white/[0.06] flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> {t('analysis.rewriteAvailable')}
              </span>
            )}
          </div>
          <p className="text-sm text-[#111111] dark:text-[#e8e7e4] leading-snug">{suggestion.message}</p>
        </div>
        {hasRewrite && (expanded
          ? <ChevronUp   className="w-4 h-4 text-[#787774] flex-shrink-0 mt-1" />
          : <ChevronDown className="w-4 h-4 text-[#787774] flex-shrink-0 mt-1" />)}
      </button>

      {expanded && hasRewrite && (
        <div className="border-t border-[#EAEAEA] bg-[#F7F7F5] dark:bg-white/[0.03] p-4 space-y-3">
          {beforeText ? (
            <>
              <div className="p-3 bg-[#9F2F2D]/5 border border-[#9F2F2D]/20 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-[#9F2F2D] mb-1">✗ {t('analysis.beforeCurrent')}</p>
                <p className="text-sm text-[#111111] dark:text-[#e8e7e4] italic">"{beforeText}"</p>
              </div>
              <div className="flex justify-center">
                <ArrowRight className="w-4 h-4 text-[#787774]" />
              </div>
              <div className="p-3 bg-[#346538]/5 border border-[#346538]/20 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] uppercase font-bold text-[#346538] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {t('analysis.afterRewrite')}
                  </p>
                  <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] text-[#787774] hover:text-[#111111] dark:text-[#e8e7e4] transition-colors">
                    {copied ? <Check className="w-3 h-3 text-[#346538]" /> : <Copy className="w-3 h-3" />}
                    {copied ? t('analysis.copied') : t('analysis.copy')}
                  </button>
                </div>
                <p className="text-sm text-[#111111] dark:text-[#e8e7e4]">"{afterText}"</p>
              </div>
            </>
          ) : (
            <div className="p-3 bg-[#F1F1EF] dark:bg-white/[0.06] border border-[#EAEAEA] rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase font-bold text-[#787774] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {t('try.aiTipLabel')}
                </p>
                <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] text-[#787774] hover:text-[#111111] dark:text-[#e8e7e4] transition-colors">
                  {copied ? <Check className="w-3 h-3 text-[#346538]" /> : <Copy className="w-3 h-3" />}
                  {copied ? t('analysis.copied') : t('analysis.copy')}
                </button>
              </div>
              <p className="text-sm text-[#111111] dark:text-[#e8e7e4]">{hint}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [isNewAnalysis, setIsNewAnalysis] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(() => t('analysis.loadingInit'));
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<any | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'classic'>('ai');
  const [showJDModal, setShowJDModal] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null);
  const [matchJdId, setMatchJdId] = useState<string | null>(null);
  const [coverLetterContent, setCoverLetterContent] = useState<string | null>(null);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);

  // Animated progress bar - only when doing a new analysis
  useEffect(() => {
    if (!isNewAnalysis || data || error) return;
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
  }, [isNewAnalysis, data, error]);

  useEffect(() => {
    if (!id || data || error) return;
    let active = true;

    const init = async () => {
      // 1. Try to get results immediately - handles navigating back to an existing analysis
      try {
        const { data: result } = await api.get(`/analysis/${id}/results`);
        if (active) { setData(result); setProgress(100); }
        return;
      } catch (err: any) {
        if (err.response?.status !== 404) {
          // Real error (e.g. 400 bad ID, 403 forbidden)
          if (active) setError(err.response?.data?.detail || t('analysis.errorLoad'));
          return;
        }
        // 404 = analysis not done yet → show loading screen and poll
      }

      // 2. Analysis not ready - show loading screen and poll
      setIsNewAnalysis(true);
      const startTime = Date.now();
      const timeout = 60000;

      const check = async () => {
        if (!active) return;
        if (Date.now() - startTime > timeout) {
          if (active) setError(t('analysis.errorTimeout'));
          return;
        }
        try {
          const { data: status } = await api.get(`/analysis/${id}/status`);
          if (status.status === 'failed') {
            if (active) setError(status.error_message || t('analysis.errorFailed'));
            return;
          }
          if (status.status === 'completed') {
            setLoadingMsg(t('analysis.loadingFinalizing'));
            setProgress(99);
            try {
              const { data: result } = await api.get(`/analysis/${id}/results`);
              if (active) { setData(result); setProgress(100); }
            } catch {
              if (active) setError(t('analysis.errorResults'));
            }
            return;
          }
          if (status.status === 'pending')    setLoadingMsg(t('analysis.loadingQueue'));
          if (status.status === 'processing') setLoadingMsg(t('try.processingSub'));
          setTimeout(check, 2000);
        } catch (err: any) {
          if (err.response?.status === 404) { if (active) setError(t('analysis.errorNotFound')); }
          else setTimeout(check, 3000);
        }
      };
      check();
    };

    init();
    return () => { active = false; };
  }, [id]);

  // Loading screen (only for new analyses being processed)
  if (!data && !error && isNewAnalysis) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <AnalyzingScreen
          progress={progress}
          heading={t('try.processingHeading')}
          message={loadingMsg}
          steps={[
            { label: t('try.step1'), threshold: 20 },
            { label: t('try.step2'), threshold: 45 },
            { label: t('try.step3'), threshold: 70 },
            { label: t('try.step4'), threshold: 90 },
          ]}
          footer={t('try.processingFooter')}
        />
      </div>
    );
  }

  // â”€â”€ Error screen â”€â”€
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="text-center max-w-lg">
          <div className="w-16 h-16 mx-auto bg-[#9F2F2D]/10 text-[#9F2F2D] rounded-2xl flex items-center justify-center mb-5">
            <Zap className="w-8 h-8" />
          </div>
          <h2 className="font-sans text-2xl tracking-tight text-[#111111] dark:text-[#e8e7e4] mb-2">{t('analysis.errorTitle')}</h2>
          <p className="text-[#787774] text-sm mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-[#F1F1EF] dark:bg-white/[0.06] border border-[#EAEAEA] text-[#111111] dark:text-[#e8e7e4] hover:bg-[#EAEAEA] transition-colors text-sm font-medium mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> {t('common.backToDashboard')}
          </button>
        </Card>
      </div>
    );
  }

  // Guard: data not yet loaded (first render while fetching an existing analysis)
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#EAEAEA] border-t-[#111111] rounded-full animate-spin" />
      </div>
    );
  }

  const handleGenerateCoverLetter = async () => {
    if (!data?.cv_id || !matchJdId) return;
    setIsGeneratingCoverLetter(true);
    try {
      const letter = await createCoverLetter(data.cv_id, matchJdId);
      setCoverLetterContent(letter.content);
    } catch (err) {
      console.error('Cover letter generation failed', err);
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

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
          className="flex items-center text-sm font-medium text-[#787774] dark:text-[#908d89] hover:text-[#111111] dark:text-[#e8e7e4] dark:hover:text-[#e8e7e4] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.backToDashboard')}
        </button>

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-sans text-3xl tracking-tight text-[#111111] dark:text-[#e8e7e4]">{t('analysis.reportTitle')}</h1>
              {data!.ai_enhanced && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F1EF] dark:bg-white/[0.06] border border-[#EAEAEA] text-[#787774] text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> {t('analysis.aiEnhanced')}
                </span>
              )}
            </div>
            <p className="text-[#787774] text-sm">{t('analysis.reportMeta', { id: data!.id })}</p>
          </div>
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-[#111111] text-white font-semibold text-sm hover:bg-[#2a2a2a] transition-colors"
          >
            <FileText className="w-4 h-4" />
            {t('analysis.viewOriginalCv')}
          </button>
        </div>

        <div className="space-y-8">

          {/* Scores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="flex flex-col items-center justify-center py-8">
              <ScoreRing score={Math.round(data!.scores.overall_score)} label={t('analysis.overallScore')} colorClass="" />
            </Card>
            <Card className="flex flex-col items-center justify-center py-8">
              <ScoreRing score={Math.round(data!.scores.ats_score)} label={t('analysis.atsCompat')} colorClass="text-[#3b82f6]" />
            </Card>
            <Card className="flex flex-col items-center justify-center py-8">
              <ScoreRing score={Math.round(data!.scores.keyword_score)} label={t('analysis.keywordRelevance')} colorClass="text-[#8b5cf6]" />
            </Card>
          </div>

          {/* ATS X-Ray: what the scanner actually sees */}
          {data!.layout_xray && (
            <AtsXraySection xray={data!.layout_xray} cvId={data!.cv_id} />
          )}

          {/* AI Executive Summary */}
          {data!.ai_summary && (
            <Card className="surface relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#787774]" />
                <h3 className="font-semibold text-base text-[#111111] dark:text-[#e8e7e4]">{t('analysis.aiExecSummary')}</h3>
              </div>
              <p className={`text-[#111111] dark:text-[#e8e7e4] leading-relaxed text-[15px] ${data!.is_summary_locked ? 'blur-[3px] opacity-60 select-none pointer-events-none' : ''}`}>
                {data!.ai_summary}
              </p>
              {data!.is_summary_locked && (
                <div className="absolute inset-0 bg-white/80 dark:bg-[#111110]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <div className="p-2 bg-[#F1F1EF] dark:bg-white/[0.06] dark:bg-white/[0.08] rounded-full">
                    <Lock className="w-5 h-5 text-[#787774] dark:text-[#908d89]" />
                  </div>
                  <button
                    onClick={undefined}
                    className="px-4 py-2 bg-[#111111] text-white text-sm font-medium rounded-[var(--radius-md)] hover:bg-[#2a2a2a] transition-colors"
                  >
                    {t('analysis.upgradeToUnlock')}
                  </button>
                </div>
              )}
            </Card>
          )}

          {/* Strengths & Weaknesses */}
          {(data!.strengths.length > 0 || data!.weaknesses.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card noPadding className="overflow-hidden">
                <div className="px-5 py-4 border-b border-[#EAEAEA] bg-[#F7F7F5] dark:bg-white/[0.03]">
                  <h3 className="font-semibold text-base text-[#111111] dark:text-[#e8e7e4]">{t('analysis.keyStrengths')}</h3>
                </div>
                <ul className="p-5 space-y-2.5">
                  {data!.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[#111111] dark:text-[#e8e7e4]">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#346538] flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card noPadding className="overflow-hidden">
                <div className="px-5 py-4 border-b border-[#EAEAEA] bg-[#F7F7F5] dark:bg-white/[0.03]">
                  <h3 className="font-semibold text-base text-[#111111] dark:text-[#e8e7e4]">{t('analysis.areasToImprove')}</h3>
                </div>
                <ul className="p-5 space-y-2.5">
                  {data!.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[#111111] dark:text-[#e8e7e4]">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#9F2F2D] flex-shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}

          {/* Suggestions with tab switcher */}
          <Card>
            <div className="flex border-b border-[#EAEAEA] mb-6">
              {hasAI && (
                <button
                  onClick={() => setActiveTab('ai')}
                  className={[
                    'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                    activeTab === 'ai'
                      ? 'border-[#111111] dark:border-[#e8e7e4] text-[#111111] dark:text-[#e8e7e4]'
                      : 'border-transparent text-[#787774] dark:text-[#908d89] hover:text-[#111111] dark:hover:text-[#e8e7e4]',
                  ].join(' ')}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('analysis.aiSuggestionsTab')}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F1F1EF] dark:bg-white/[0.06] text-[#787774] font-bold">
                    {data!.ai_suggestions.length}
                  </span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('classic')}
                className={[
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                  activeTab === 'classic'
                    ? 'border-[#111111] dark:border-[#e8e7e4] text-[#111111] dark:text-[#e8e7e4]'
                    : 'border-transparent text-[#787774] dark:text-[#908d89] hover:text-[#111111] dark:hover:text-[#e8e7e4]',
                ].join(' ')}
              >
                <Zap className="w-3.5 h-3.5" />
                {t('analysis.ruleBasedTab')}
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F1F1EF] dark:bg-white/[0.06] text-[#787774] font-bold">
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
                  <p className="text-sm text-[#787774]">
                    {t('analysis.classicHint')}
                  </p>
                  {activeSuggestion?.snippets?.length > 0 && (
                    <button
                      onClick={() => setIsPdfModalOpen(true)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-md)] bg-[#F1F1EF] dark:bg-white/[0.06] text-[#111111] dark:text-[#e8e7e4] border border-[#EAEAEA] hover:bg-[#EAEAEA] transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {t('analysis.viewInCv', { count: activeSuggestion.snippets.length })}
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
              <div className="p-6 border-b border-[#EAEAEA] bg-[#F7F7F5] dark:bg-white/[0.03]">
                <h3 className="font-sans text-xl tracking-tight text-[#111111] dark:text-[#e8e7e4]">{t('analysis.careerMatches')}</h3>
                <p className="text-sm text-[#787774] mt-1">{t('analysis.careerMatchesDesc')}</p>
              </div>
              <div className="p-6">
                <RoleMatcher recommendations={data!.career_recommendations ?? []} />
              </div>
            </Card>
            <Card>
              <h3 className="font-sans text-xl tracking-tight text-[#111111] dark:text-[#e8e7e4] mb-4">{t('analysis.extractedSkills')}</h3>
              <SkillTags skills={data!.extracted_skills} />
            </Card>
          </div>

          {/* JD Match Section */}
          <div className="surface p-6 rounded-xl border border-[#EAEAEA] dark:border-white/[0.07] relative overflow-hidden">
            {user?.plan_type !== 'premium' ? (
              <>
                <div className="blur-sm pointer-events-none select-none opacity-40 min-h-[120px]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#787774] mb-2">{t('match.sectionLabel')}</p>
                  <p className="text-sm text-[#787774]">{t('match.sectionDesc')}</p>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm bg-white/60 dark:bg-[#111110]/70">
                  <div className="p-2 mb-2 bg-[#F1F1EF] dark:bg-white/[0.06] rounded-full">
                    <Lock className="w-5 h-5 text-[#787774] dark:text-[#908d89]" />
                  </div>
                  <p className="text-xs font-semibold text-[#111111] dark:text-[#e8e7e4] mb-3">{t('match.proGateTitle')}</p>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="px-4 py-2 bg-[#111111] text-white text-sm font-medium rounded-[var(--radius-md)] hover:bg-[#2a2a2a] transition-colors"
                  >
                    {t('match.proGateButton')}
                  </button>
                </div>
              </>
            ) : matchResult ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#787774] mb-4">{t('match.sectionLabel')}</p>
                <MatchResultCard
                  match={matchResult}
                  onGenerateCoverLetter={handleGenerateCoverLetter}
                  isGeneratingCoverLetter={isGeneratingCoverLetter}
                />
                <button
                  onClick={() => setShowJDModal(true)}
                  className="mt-4 text-sm underline text-[#787774] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors"
                >
                  {t('match.tryAnotherJD')}
                </button>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#787774] mb-2">{t('match.sectionLabel')}</p>
                <p className="text-sm text-[#787774] mb-4">{t('match.sectionDesc')}</p>
                <button
                  onClick={() => setShowJDModal(true)}
                  className="px-4 py-2 bg-[#111111] text-white text-sm font-medium rounded-[var(--radius-md)] hover:bg-[#2a2a2a] transition-colors"
                >
                  {t('match.openModal')}
                </button>
              </>
            )}
          </div>

        </div>
      </div>

      {showJDModal && data?.cv_id && (
        <JDInputModal
          cvId={data.cv_id}
          onClose={() => setShowJDModal(false)}
          onMatchComplete={(match, jdId) => {
            setMatchResult(match);
            setMatchJdId(jdId);
            setShowJDModal(false);
          }}
        />
      )}
      {coverLetterContent && (
        <CoverLetterModal
          content={coverLetterContent}
          onClose={() => setCoverLetterContent(null)}
        />
      )}
      <PDFViewerModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        cvId={data!.cv_id}
        activeSnippets={modalSnippets}
      />
    </>
  );
}
