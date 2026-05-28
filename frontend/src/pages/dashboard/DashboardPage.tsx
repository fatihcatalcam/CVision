import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import api from '../../services/api';
import { Shield, Settings, LogOut, Plus, Sparkles } from 'lucide-react';
import { ScoreHeroCard } from '../../components/dashboard/ScoreHeroCard';
import { CareerInsightCard } from '../../components/dashboard/CareerInsightCard';
import { NextStepCard } from '../../components/dashboard/NextStepCard';
import { QuotaCard } from '../../components/dashboard/QuotaCard';
import { RecentAnalysesList } from '../../components/dashboard/RecentAnalysesList';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { UploadModal } from '../../components/dashboard/UploadModal';

interface DashboardSummary {
  total_cvs: number;
  total_analyses: number;
  average_score: number | null;
  latest_score: number | null;
  latest_ats_score: number | null;
  latest_keyword_score: number | null;
  latest_completeness_score: number | null;
  latest_analysis_id: number | null;
  latest_cv_id: string | null;
  score_delta: number | null;
  latest_role_title: string | null;
  latest_role_match: number | null;
  top_suggestion: string | null;
}

interface HistoryItem {
  cv_id: string;
  original_filename: string;
  target_domain: string | null;
  status: string;
  uploaded_at: string;
  overall_score: number | null;
  ats_score: number | null;
  keyword_score: number | null;
  analysis_id: number | null;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Günaydın';
  if (h < 17) return 'İyi günler';
  return 'İyi akşamlar';
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const bgColors = ['bg-[#1B3A6B]', 'bg-[#1F6C9F]', 'bg-[#346538]', 'bg-[#956400]'];
  return (
    <div
      className={`w-9 h-9 rounded-xl ${bgColors[name.charCodeAt(0) % 4]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg`}
    >
      {initials}
    </div>
  );
}

function formatCountdown(resetAt: string | null, now: number): string | null {
  if (!resetAt) return null;
  const diff = new Date(resetAt).getTime() - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return '< 1m';
}

function formatResetDate(resetAt: string | null): string | null {
  if (!resetAt) return null;
  const d = new Date(resetAt);
  if (isNaN(d.getTime()) || d.getTime() <= Date.now()) return null;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 mb-8">
      <div className="surface h-64 shimmer" />
      <div className="flex flex-col gap-4">
        <div className="surface h-28 shimmer" />
        <div className="surface h-24 shimmer" />
        <div className="surface h-32 shimmer" />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentItems, setRecentItems] = useState<HistoryItem[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summaryRes, histRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/history?limit=5&skip=0'),
        ]);
        setSummary(summaryRes.data);
        setRecentItems(histRes.data.items);
        await refreshUser();
      } catch (error) {
        console.error('Dashboard fetch failed', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const quota = user?.plan_type === 'premium' ? 50 : 3;
  const quotaWindowExpired = user?.quota_reset_at
    ? new Date(user.quota_reset_at).getTime() <= now
    : false;
  const used = quotaWindowExpired ? 0 : (user?.analysis_count ?? 0);
  const remaining = Math.max(0, quota - used);
  const countdown = formatCountdown(user?.quota_reset_at ?? null, now);
  const resetDate = formatResetDate(user?.quota_reset_at ?? null);
  const hasAnalyses = !!(summary && summary.total_analyses > 0);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-in slide-up">

      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3.5">
          <Avatar name={user?.full_name || 'U'} />
          <div>
            <p className="text-xs text-[#787774] dark:text-[#908d89] font-medium">
              {getGreeting()},
            </p>
            <h1 className="font-sans text-2xl tracking-tight text-[#111111] dark:text-[#e8e7e4]">
              {user?.full_name}
            </h1>
          </div>
          {user?.plan_type === 'premium' && (
            <span className="ml-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5" /> Pro
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] text-xs font-bold hover:bg-[#2a2a2a] dark:hover:bg-[#d0cfcc] active:scale-[0.98] transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Yeni Analiz
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/hq-portal')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/15 transition-all"
            >
              <Shield className="w-3.5 h-3.5" /> Admin
            </button>
          )}
          <ThemeToggle />
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3] dark:hover:bg-white/[0.05] border border-transparent hover:border-[#EAEAEA] dark:hover:border-white/[0.07] transition-all text-xs font-medium"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3] dark:hover:bg-white/[0.05] border border-transparent hover:border-[#EAEAEA] dark:hover:border-white/[0.07] transition-all text-xs font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      {isLoading ? (
        <DashboardSkeleton />
      ) : !hasAnalyses ? (
        <EmptyState onUploadSuccess={(cvId) => navigate(`/analysis/${cvId}`)} />
      ) : (
        <>
          {/* 2-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 mb-8">
            <ScoreHeroCard
              latestScore={summary!.latest_score!}
              latestCvId={summary!.latest_cv_id!}
              latestRoleTitle={summary!.latest_role_title}
              scoreDelta={summary!.score_delta}
              atsScore={summary!.latest_ats_score}
              keywordScore={summary!.latest_keyword_score}
              completenessScore={summary!.latest_completeness_score}
            />
            <div className="flex flex-col gap-4">
              {summary!.latest_role_title && summary!.latest_role_match !== null && (
                <CareerInsightCard
                  roleTitle={summary!.latest_role_title}
                  matchScore={summary!.latest_role_match}
                />
              )}
              {summary!.top_suggestion && (
                <NextStepCard suggestion={summary!.top_suggestion} />
              )}
              <QuotaCard
                remaining={remaining}
                quota={quota}
                isPremium={user?.plan_type === 'premium'}
                countdown={countdown}
                resetDate={resetDate}
              />
            </div>
          </div>

          <RecentAnalysesList items={recentItems} />
        </>
      )}

      {/* ── Upload modal ── */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={(cvId) => navigate(`/analysis/${cvId}`)}
      />
    </div>
  );
}
