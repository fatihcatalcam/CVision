import { useEffect, useState } from 'react';
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
  overall_score: number;
  ats_score: number;
  keyword_score: number;
  grammar_score: number;
  suggestions: any[];
  extracted_skills: any[];
  recommendations?: any[];
}

export function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('Initializing AI Pipeline...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const runAnalysis = async () => {
      try {
        // Step 1: Trigger the heavy backend analysis pipeline
        setLoadingMsg('Extracting text and scanning ATS structure...');
        await api.post(`/analysis/${id}`);
        
        // Step 2: Fetch the synthesized results
        if (!isMounted) return;
        setLoadingMsg('Generating career recommendations...');
        const result = await api.get(`/analysis/${id}/results`);
        
        setData(result.data);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
      }
    };

    if (id) {
      runAnalysis();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

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
        <div className="text-center animate-pulse">
          <h2 className="text-xl font-bold text-white mb-1">Analyzing CV</h2>
          <p className="text-[var(--color-muted)] text-sm">{loadingMsg}</p>
          <p className="text-xs text-zinc-600 mt-4 max-w-[200px] mx-auto text-balance">
            Please wait. Extensive ML models and heuristics are scoring your profile.
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
          <ScoreRing score={Math.round(data.overall_score)} label="Overall Score" size={80} colorClass="" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column: Sub Scores */}
        <Card className="col-span-1 flex flex-col items-center justify-center gap-6 py-10">
          <ScoreRing score={Math.round(data.ats_score)} label="ATS Compatibility" colorClass="text-[#3b82f6]" />
          <div className="w-full h-px bg-zinc-800 my-2" />
          <ScoreRing score={Math.round(data.keyword_score)} label="Keyword Relevance" colorClass="text-[#8b5cf6]" />
        </Card>

        {/* Center/Right Column: Suggestions & Recommendations */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <Card noPadding className="overflow-hidden">
            <div className="p-6 border-b border-[var(--color-card-border)] bg-[rgba(255,255,255,0.02)]">
              <h3 className="text-lg font-bold text-white">Career Profile Matches</h3>
              <p className="text-sm text-[var(--color-muted)] mt-1">Comparing your extracted skills against our database roles</p>
            </div>
            <div className="p-6">
              <RoleMatcher recommendations={data.recommendations || []} />
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
