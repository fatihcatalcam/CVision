import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Zap, FileText } from 'lucide-react';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { ScoreRing } from '../../components/analysis/ScoreRing';
import { SkillTags } from '../../components/analysis/SkillTags';
import { SuggestionList } from '../../components/analysis/SuggestionList';
import { RoleMatcher } from '../../components/analysis/RoleMatcher';
import { PDFViewerModal } from '../../components/analysis/PDFViewerModal';

interface AnalysisResponse {
  id: number;
  cv_id: number;
  scores: {
    overall_score: number;
    ats_score: number;
    keyword_score: number;
  };
  extracted_text: string | null;
  suggestions: any[];
  extracted_skills: any[];
  career_recommendations?: any[];
}

export function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('Initializing AI Pipeline...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<any | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Simulated progress bar effect
  useEffect(() => {
    if (data || error) return;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) return prev + 2;
        if (prev < 60) return prev + 1;
        if (prev < 90) return prev + 0.5;
        if (prev < 95) return prev + 0.1;
        return prev;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [data, error]);

  useEffect(() => {
    let active = true;

    const executeWorkflow = async () => {
      const startTime = Date.now();
      const TIMEOUT_MS = 30000;

      const pollStatus = async () => {
        if (!active) return;
        
        if (Date.now() - startTime > TIMEOUT_MS) {
          if (active) setError('Analysis timed out after 30 seconds.');
          return;
        }
        
        try {
          const statusRes = await api.get(`/analysis/${id}/status`);
          const statusData = statusRes.data;

          if (statusData.status === 'failed') {
            if (active) setError(statusData.error_message || 'Background analysis failed.');
            return;
          }

          if (statusData.status === 'completed') {
            setLoadingMsg('Finalizing report...');
            setProgress(99); 
            
            try {
              const resultRes = await api.get(`/analysis/${id}/results`);
              if (active) {
                setData(resultRes.data);
                setProgress(100);
              }
            } catch (err: any) {
              if (active) setError('Failed to retrieve finalized results.');
            }
            return;
          }

          if (statusData.status === 'pending') {
            setLoadingMsg('Waiting in queue...');
          } else if (statusData.status === 'processing') {
            setLoadingMsg('Analyzing CV structure and extracting insights...');
          }

          setTimeout(pollStatus, 2000);

        } catch (err: any) {
          if (err.response?.status === 404) {
            if (active) setError('CV not found.');
          } else {
            console.error("Status check failed:", err);
            setTimeout(pollStatus, 3000);
          }
        }
      };

      pollStatus();
    };

    if (id && !data && !error) {
      executeWorkflow();
    }

    return () => {
      active = false;
    };
  }, [id, data, error]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="text-center max-w-lg shadow-red-500/10">
          <div className="w-16 h-16 mx-auto bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
            <Zap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Analysis Failed</h2>
          <p className="text-[var(--color-muted)] mb-6">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-[var(--color-primary)] hover:underline"
          >
            ← Return to Dashboard
          </button>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-[var(--color-primary)] animate-spin" />
          <div className="absolute inset-0 border-4 border-[var(--color-primary)] opacity-20 rounded-full scale-150 animate-ping" />
        </div>
        <div className="text-center animate-pulse w-full max-w-md px-6">
          <h2 className="text-xl font-bold text-white mb-2">Analyzing CV</h2>
          <p className="text-[var(--color-muted)] text-sm mb-4 h-5">{loadingMsg}</p>
          
          <div className="w-full bg-zinc-800 rounded-full h-2 mb-2 overflow-hidden border border-zinc-700">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-indigo-400 font-bold tracking-widest text-right mb-6">
            {Math.floor(progress)}%
          </p>

          <p className="text-xs text-zinc-500 mx-auto text-balance leading-relaxed">
            Please wait. Extensive ML models and heuristics are scoring your profile. This may take up to 20-30 seconds depending on the size of your CV.
          </p>
        </div>
      </div>
    );
  }

  // Collect all snippets from the active suggestion for the modal
  const modalSnippets = (activeSuggestion?.snippets || []).map((s: string) => ({
    text: s,
    priority: activeSuggestion?.priority || 'medium',
  }));

  return (
    <>
      <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-500 delay-150">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-sm font-medium text-[var(--color-muted)] hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

        {/* Header with Overall Score and View CV Button */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Analysis Report</h1>
            <p className="text-[var(--color-muted)] text-sm">Report #{data.id} • Processed by CVision AI</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <FileText className="w-4 h-4" />
              View Original CV
            </button>
            <div className="hidden sm:block">
              <ScoreRing score={Math.round(data.scores.overall_score)} label="Overall Score" size={80} colorClass="" />
            </div>
          </div>
        </div>

        {/* Full-width single column layout */}
        <div className="space-y-8">
          {/* Score Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="flex flex-col items-center justify-center py-8">
              <ScoreRing score={Math.round(data.scores.overall_score)} label="Overall Score" colorClass="" />
            </Card>
            <Card className="flex flex-col items-center justify-center py-8">
              <ScoreRing score={Math.round(data.scores.ats_score)} label="ATS Compatibility" colorClass="text-[#3b82f6]" />
            </Card>
            <Card className="flex flex-col items-center justify-center py-8">
              <ScoreRing score={Math.round(data.scores.keyword_score)} label="Keyword Relevance" colorClass="text-[#8b5cf6]" />
            </Card>
          </div>

          {/* Suggestions */}
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Top Fixes
                <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full">{data.suggestions.length}</span>
              </h3>
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
            <p className="text-sm text-[var(--color-muted)] mb-6">
              Click an issue to select it, then press "View in CV" to see the original document with highlighted problems.
            </p>
            <SuggestionList 
              suggestions={data.suggestions} 
              activeSuggestionId={activeSuggestion?.id}
              onSelectSuggestion={(suggestion) => {
                if (activeSuggestion?.id === suggestion.id) {
                  setActiveSuggestion(null);
                } else {
                  setActiveSuggestion(suggestion);
                }
              }}
            />
          </Card>

          {/* Career Matches & Skills Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card noPadding className="overflow-hidden">
              <div className="p-6 border-b border-[var(--color-card-border)] bg-[rgba(255,255,255,0.02)]">
                <h3 className="text-lg font-bold text-white">Career Profile Matches</h3>
                <p className="text-sm text-[var(--color-muted)] mt-1">Comparing your extracted skills against our database roles</p>
              </div>
              <div className="p-6">
                <RoleMatcher recommendations={data.career_recommendations || []} />
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-bold text-white mb-4">Extracted Skills</h3>
              <SkillTags skills={data.extracted_skills} />
            </Card>
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      <PDFViewerModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        cvId={data.cv_id}
        activeSnippets={modalSnippets}
      />
    </>
  );
}
