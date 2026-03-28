import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Zap } from 'lucide-react';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { ScoreRing } from '../../components/analysis/ScoreRing';
import { SkillTags } from '../../components/analysis/SkillTags';
import { SuggestionList } from '../../components/analysis/SuggestionList';
import { RoleMatcher } from '../../components/analysis/RoleMatcher';

interface AnalysisResponse {
  id: number;
  scores: {
    overall_score: number;
    ats_score: number;
    keyword_score: number;
  };
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


  // Simulated progress bar effect
  useEffect(() => {
    if (data || error) return;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Slow down the progress as it gets closer to 95%
        if (prev < 30) return prev + 2;
        if (prev < 60) return prev + 1;
        if (prev < 90) return prev + 0.5;
        if (prev < 95) return prev + 0.1;
        return prev; // Hold at 95% until complete
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

          // If pending or processing, update message and poll again
          if (statusData.status === 'pending') {
            setLoadingMsg('Waiting in queue...');
          } else if (statusData.status === 'processing') {
            setLoadingMsg('Analyzing CV structure and extracting insights...');
          }

          // Continue polling every 2 seconds
          setTimeout(pollStatus, 2000);

        } catch (err: any) {
          if (err.response?.status === 404) {
            if (active) setError('CV not found.');
          } else {
            console.error("Status check failed:", err);
            // Don't kill polling on transient network errors, just retry
            setTimeout(pollStatus, 3000);
          }
        }
      };

      // Start the polling loop
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
          
          {/* Simulated Loading Bar */}
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

  // Layout the finalized data
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-500 delay-150">
      <button 
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-sm font-medium text-[var(--color-muted)] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Analysis Report</h1>
          <p className="text-[var(--color-muted)] text-sm">Report #{data.id} • Processed by CVision AI</p>
        </div>
        <div className="hidden sm:block">
          <ScoreRing score={Math.round(data.scores.overall_score)} label="Overall Score" size={80} colorClass="" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column: Sub Scores */}
        <Card className="col-span-1 flex flex-col items-center justify-center gap-6 py-10">
          <ScoreRing score={Math.round(data.scores.ats_score)} label="ATS Compatibility" colorClass="text-[#3b82f6]" />
          <div className="w-full h-px bg-zinc-800 my-2" />
          <ScoreRing score={Math.round(data.scores.keyword_score)} label="Keyword Relevance" colorClass="text-[#8b5cf6]" />
        </Card>

        {/* Center/Right Column: Suggestions & Recommendations */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <Card noPadding className="overflow-hidden">
            <div className="p-6 border-b border-[var(--color-card-border)] bg-[rgba(255,255,255,0.02)]">
              <h3 className="text-lg font-bold text-white">Career Profile Matches</h3>
              <p className="text-sm text-[var(--color-muted)] mt-1">Comparing your extracted skills against our database roles</p>
            </div>
            <div className="p-6">
              <RoleMatcher recommendations={data.career_recommendations || []} />
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold text-white mb-4">Extracted Skills</h3>
          <SkillTags skills={data.extracted_skills} />
        </Card>
        <Card>
          <h3 className="text-lg font-bold text-white mb-4">Improvement Suggestions</h3>
          <SuggestionList suggestions={data.suggestions} />
        </Card>
      </div>
    </div>
  );
}
