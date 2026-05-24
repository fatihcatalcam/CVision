import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CVUploader } from '../../components/cv/CVUploader';
import api from '../../services/api';
import {
  FileText, Activity, TrendingUp, Shield, Lock, Sparkles,
  LogOut, ChevronRight, Upload, History, Settings,
} from 'lucide-react';

interface DashboardStats {
  total_cvs: number;
  total_analyses: number;
  average_score: number | null;
  latest_score: number | null;
}

interface HistoryItem {
  cv_id: number;
  original_filename: string;
  target_domain: string | null;
  status: string;
  uploaded_at: string;
  overall_score: number | null;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const bgColors = ['bg-[#1B3A6B]', 'bg-[#1F6C9F]', 'bg-[#346538]', 'bg-[#956400]'];
  return (
    <div className={`w-9 h-9 rounded-xl ${bgColors[name.charCodeAt(0) % 4]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg`}>
      {initials}
    </div>
  );
}

function ScoreDot({ score }: { score: number }) {
  const color = score >= 80 ? 'text-[#346538]' : score >= 60 ? 'text-amber-600' : 'text-red-600';
  return <span className={`font-black stat-number ${color}`}>{Math.round(score)}%</span>;
}

export function DashboardPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentItems, setRecentItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const quota = user?.plan_type === 'premium' ? 50 : 3;
  const used = user?.analysis_count || 0;
  const remaining = Math.max(0, quota - used);
  const usedPct = Math.min((remaining / quota) * 100, 100);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, histRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/history?limit=5&skip=0'),
        ]);
        setStats(statsRes.data);
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

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-in slide-up">

      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3.5">
          <Avatar name={user?.full_name || 'U'} />
          <div>
            <p className="text-xs text-[#787774] dark:text-[#908d89] font-medium">{getGreeting()},</p>
            <h1 className="font-serif text-2xl tracking-tight text-[#111111] dark:text-[#e8e7e4]">{user?.full_name}</h1>
          </div>
          {user?.plan_type === 'premium' && (
            <span className="ml-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5" /> Pro
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/hq-portal')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/15 transition-all">
              <Shield className="w-3.5 h-3.5" /> Admin
            </button>
          )}
          <button onClick={() => navigate('/settings')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3] dark:hover:bg-white/[0.05] border border-transparent hover:border-[#EAEAEA] dark:hover:border-white/[0.07] transition-all text-xs font-medium" title="Settings">
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>
          <button onClick={logout} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3] dark:hover:bg-white/[0.05] border border-transparent hover:border-[#EAEAEA] dark:hover:border-white/[0.07] transition-all text-xs font-medium">
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {[1, 2, 3, 4].map(i => <div key={i} className="surface h-36 shimmer" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className="surface p-5">
            <div className="p-2.5 rounded-xl w-fit bg-[#E1F3FE] dark:bg-[#1F6C9F]/20">
              <FileText className="w-5 h-5 text-[#1F6C9F]" />
            </div>
            <div>
              <span className="stat-number text-2xl font-semibold text-[#111111] dark:text-[#e8e7e4] block mb-0.5">{stats?.total_cvs || 0}</span>
              <span className="text-xs text-[#787774] dark:text-[#908d89]">Uploaded CVs</span>
            </div>
          </div>

          <div className="surface p-5">
            <div className="p-2.5 rounded-xl w-fit bg-[#EDF3EC] dark:bg-[#346538]/20">
              <TrendingUp className="w-5 h-5 text-[#346538]" />
            </div>
            <div>
              <span className="stat-number text-2xl font-semibold text-[#111111] dark:text-[#e8e7e4] block mb-0.5">
                {stats?.average_score != null ? `${stats.average_score}%` : 'N/A'}
              </span>
              <span className="text-xs text-[#787774] dark:text-[#908d89]">Avg Match Score</span>
            </div>
          </div>

          <div className="surface p-5">
            <div className="p-2.5 rounded-xl w-fit bg-[#EEF2F8] dark:bg-[#1B3A6B]/20">
              <Activity className="w-5 h-5 text-[#1B3A6B] dark:text-[#4a7dd1]" />
            </div>
            <div>
              <span className="stat-number text-2xl font-semibold text-[#111111] dark:text-[#e8e7e4] block mb-0.5">{stats?.total_analyses || 0}</span>
              <span className="text-xs text-[#787774] dark:text-[#908d89]">Total Analyses</span>
            </div>
          </div>

          {/* Quota card */}
          <div className="surface p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-[#FBF3DB] dark:bg-[#956400]/20">
                {user?.plan_type === 'premium' ? <Sparkles className="w-4 h-4 text-[#956400]" /> : <Lock className="w-4 h-4 text-[#956400]" />}
              </div>
            </div>
            <div>
              <span className="stat-number text-2xl font-semibold text-[#111111] dark:text-[#e8e7e4] block mb-0.5">
                {remaining}<span className="text-lg font-semibold text-[#787774] dark:text-[#908d89]"> / {quota}</span>
              </span>
              <span className="text-xs text-[#787774] dark:text-[#908d89]">{user?.plan_type === 'premium' ? 'Pro analyses / week' : 'Free analyses / week'}</span>
            </div>
            <div className="w-full bg-[#EAEAEA] dark:bg-white/[0.07] rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-700 ${user?.plan_type === 'premium' ? 'bg-amber-500' : 'bg-[#1B3A6B]'}`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
            {user?.plan_type === 'free' && (
              <button
                onClick={() => navigate('/pricing')}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#111111] text-white text-xs font-bold hover:bg-[#2a2a2a] active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-3 h-3" /> Upgrade to Pro <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recent Analyses */}
      {!isLoading && recentItems.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#111111] dark:text-[#e8e7e4] text-sm flex items-center gap-2">
              <History className="w-5 h-5 text-[#787774] dark:text-[#908d89]" />
              Recent Analyses
            </h2>
            <button
              onClick={() => navigate('/history')}
              className="flex items-center gap-1.5 text-xs text-[#787774] hover:text-[#1B3A6B] transition-colors font-medium"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {recentItems.map((item) => (
              <div
                key={item.cv_id}
                onClick={() => item.status === 'completed' && navigate(`/analysis/${item.cv_id}`)}
                className={`surface p-4 flex items-center gap-4 transition-shadow ${
                  item.status === 'completed' ? 'cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] group' : ''
                }`}
              >
                <div className="p-2 rounded-lg bg-[#F7F6F3] dark:bg-white/[0.05] text-[#787774] dark:text-[#908d89] flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111111] dark:text-[#e8e7e4] truncate">{item.original_filename}</p>
                  <p className="text-xs text-[#787774] dark:text-[#908d89] mt-0.5">
                    {item.target_domain && <span className="mr-2">{item.target_domain}</span>}
                    {new Date(item.uploaded_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                {item.overall_score !== null ? (
                  <ScoreDot score={item.overall_score} />
                ) : (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.status === 'failed' ? 'text-red-600 bg-red-50 dark:bg-red-500/10' : 'text-[#787774] dark:text-[#908d89] bg-[#F7F6F3] dark:bg-white/[0.05]'
                  }`}>
                    {item.status}
                  </span>
                )}
                {item.status === 'completed' && (
                  <ChevronRight className="w-4 h-4 text-[#A09D9A] group-hover:text-[#1B3A6B] transition-colors flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload section */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-[#111111] dark:text-[#e8e7e4] text-sm flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#1B3A6B] dark:text-[#4a7dd1]" />
              Analyze New CV
            </h2>
            <p className="text-xs text-[#787774] dark:text-[#908d89] mt-1">Upload your resume and get instant AI feedback</p>
          </div>
          {stats?.latest_score != null && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F7F6F3] border border-[#EAEAEA] text-xs">
              <span className="text-[#787774]">Latest</span>
              <ScoreDot score={stats.latest_score} />
            </div>
          )}
        </div>
        <CVUploader onUploadSuccess={(cvId) => navigate(`/analysis/${cvId}`)} />
      </div>
    </div>
  );
}
