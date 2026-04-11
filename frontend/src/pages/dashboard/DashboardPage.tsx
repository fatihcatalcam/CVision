import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
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
  const colors = ['from-indigo-500 to-violet-600', 'from-blue-500 to-indigo-600', 'from-violet-500 to-purple-600', 'from-emerald-500 to-teal-600'];
  return (
    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colors[name.charCodeAt(0) % 4]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg`}>
      {initials}
    </div>
  );
}

function ScoreDot({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
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
            <p className="text-xs text-zinc-500 font-medium">{getGreeting()},</p>
            <h1 className="text-lg font-black text-white leading-tight">{user?.full_name}</h1>
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
          <button onClick={() => navigate('/settings')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-xs font-medium" title="Settings">
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>
          <button onClick={logout} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-xs font-medium">
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {[1, 2, 3, 4].map(i => <div key={i} className="glass-card rounded-2xl h-36 shimmer" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <Card className="flex flex-col gap-3 h-full hover:border-white/10 transition-all duration-300 group">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl w-fit group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Uploaded CVs</p>
              <h3 className="text-3xl font-black text-white stat-number">{stats?.total_cvs || 0}</h3>
              <p className="text-xs text-zinc-600 mt-1">Total resumes</p>
            </div>
          </Card>

          <Card className="flex flex-col gap-3 h-full hover:border-white/10 transition-all duration-300 group">
            <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl w-fit group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Avg Match Score</p>
              <h3 className="text-3xl font-black text-white stat-number">
                {stats?.average_score != null ? `${stats.average_score}%` : 'N/A'}
              </h3>
              <p className="text-xs text-zinc-600 mt-1">Across all analyses</p>
            </div>
          </Card>

          <Card className="flex flex-col gap-3 h-full hover:border-white/10 transition-all duration-300 group">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Total Analyses</p>
              <h3 className="text-3xl font-black text-white stat-number">{stats?.total_analyses || 0}</h3>
              <p className="text-xs text-zinc-600 mt-1">AI reports generated</p>
            </div>
          </Card>

          {/* Quota card */}
          <Card className="flex flex-col gap-3 h-full hover:border-white/10 transition-all duration-300">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Remaining</p>
              <div className={`p-2 rounded-xl ${user?.plan_type === 'premium' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                {user?.plan_type === 'premium' ? <Sparkles className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-white stat-number">
                {remaining}<span className="text-lg font-semibold text-zinc-600"> / {quota}</span>
              </h3>
              <p className="text-xs text-zinc-600 mt-1">{user?.plan_type === 'premium' ? 'Pro analyses / week' : 'Free analyses / week'}</p>
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
              <div
                className={`h-1.5 rounded-full transition-all duration-700 ${user?.plan_type === 'premium' ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
            {user?.plan_type === 'free' && (
              <button
                onClick={() => navigate('/pricing')}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-gradient-to-r from-indigo-600/80 to-violet-600/80 border border-indigo-500/30 text-white text-xs font-bold hover:from-indigo-600 hover:to-violet-600 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
              >
                <Sparkles className="w-3 h-3" /> Upgrade to Pro <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </Card>
        </div>
      )}

      {/* Recent Analyses */}
      {!isLoading && recentItems.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <History className="w-5 h-5 text-zinc-500" />
              Recent Analyses
            </h2>
            <button
              onClick={() => navigate('/history')}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-indigo-400 transition-colors font-medium"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {recentItems.map((item) => (
              <div
                key={item.cv_id}
                onClick={() => item.status === 'completed' && navigate(`/analysis/${item.cv_id}`)}
                className={`glass-card rounded-xl border border-white/5 px-4 py-3 flex items-center gap-4 transition-all duration-200 ${
                  item.status === 'completed' ? 'hover:border-indigo-500/20 hover:bg-indigo-500/[0.02] cursor-pointer group' : ''
                }`}
              >
                <div className="p-2 rounded-lg bg-zinc-900 text-zinc-500 flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{item.original_filename}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {item.target_domain && <span className="mr-2">{item.target_domain}</span>}
                    {new Date(item.uploaded_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                {item.overall_score !== null ? (
                  <ScoreDot score={item.overall_score} />
                ) : (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.status === 'failed' ? 'text-red-400 bg-red-500/10' : 'text-zinc-500 bg-zinc-800'
                  }`}>
                    {item.status}
                  </span>
                )}
                {item.status === 'completed' && (
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
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
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              Analyze New CV
            </h2>
            <p className="text-xs text-zinc-600 mt-1">Upload your resume and get instant AI feedback</p>
          </div>
          {stats?.latest_score != null && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
              <span className="text-zinc-500">Latest</span>
              <ScoreDot score={stats.latest_score} />
            </div>
          )}
        </div>
        <CVUploader onUploadSuccess={(cvId) => navigate(`/analysis/${cvId}`)} />
      </div>
    </div>
  );
}
