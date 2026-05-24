import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CVUploader } from '../../components/cv/CVUploader';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
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
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-in">

      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3.5">
          <Avatar name={user?.full_name || 'U'} />
          <div>
            <p className="text-xs text-[#787774] font-medium">{getGreeting()},</p>
            <h1 className="font-serif text-2xl tracking-tight text-[#111111]">{user?.full_name}</h1>
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
          <ThemeToggle />
          <button onClick={() => navigate('/settings')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3] border border-transparent hover:border-[#EAEAEA] transition-all text-xs font-medium" title="Settings">
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>
          <button onClick={logout} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3] border border-transparent hover:border-[#EAEAEA] transition-all text-xs font-medium">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 stagger-grid">
          <div className="surface p-5 flex flex-col gap-4">
            <div className="p-2.5 rounded-xl w-fit" style={{ background: 'var(--color-info-bg)' }}>
              <FileText className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
            </div>
            <div>
              <span className="stat-number text-2xl font-semibold block mb-0.5" style={{ color: 'var(--color-foreground)' }}>{stats?.total_cvs || 0}</span>
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Uploaded CVs</span>
            </div>
          </div>

          <div className="surface p-5 flex flex-col gap-4">
            <div className="p-2.5 rounded-xl w-fit" style={{ background: 'var(--color-success-bg)' }}>
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
            </div>
            <div>
              <span className="stat-number text-2xl font-semibold block mb-0.5" style={{ color: 'var(--color-foreground)' }}>
                {stats?.average_score != null ? `${stats.average_score}%` : 'N/A'}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Avg Match Score</span>
            </div>
          </div>

          <div className="surface p-5 flex flex-col gap-4">
            <div className="p-2.5 rounded-xl w-fit" style={{ background: 'var(--color-accent)' }}>
              <Activity className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <span className="stat-number text-2xl font-semibold block mb-0.5" style={{ color: 'var(--color-foreground)' }}>{stats?.total_analyses || 0}</span>
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Total Analyses</span>
            </div>
          </div>

          {/* Quota card */}
          <div className="surface p-5 flex flex-col gap-3">
            <div className="p-2.5 rounded-xl w-fit" style={{ background: 'var(--color-warning-bg)' }}>
              {user?.plan_type === 'premium' ? <Sparkles className="w-4 h-4" style={{ color: 'var(--color-warning)' }} /> : <Lock className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />}
            </div>
            <div>
              <span className="stat-number text-2xl font-semibold block mb-0.5" style={{ color: 'var(--color-foreground)' }}>
                {remaining}<span className="text-lg font-semibold" style={{ color: 'var(--color-muted)' }}> / {quota}</span>
              </span>
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{user?.plan_type === 'premium' ? 'Pro analyses / week' : 'Free analyses / week'}</span>
            </div>
            <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--color-card-border)' }}>
              <div
                className={`h-1.5 rounded-full transition-all duration-700 ${user?.plan_type === 'premium' ? 'bg-amber-500' : ''}`}
                style={{ width: `${usedPct}%`, ...(user?.plan_type !== 'premium' ? { background: 'var(--color-primary)' } : {}) }}
              />
            </div>
            {user?.plan_type === 'free' && (
              <button
                onClick={() => navigate('/pricing')}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-white text-xs font-bold active:scale-[0.98] transition-all"
                style={{ background: 'var(--color-foreground)' }}
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
            <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--color-foreground)' }}>
              <History className="w-5 h-5" style={{ color: 'var(--color-muted)' }} />
              Recent Analyses
            </h2>
            <button
              onClick={() => navigate('/history')}
              className="flex items-center gap-1.5 text-xs font-medium transition-colors"
              style={{ color: 'var(--color-muted)' }}
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 stagger-list">
            {recentItems.map((item) => (
              <div
                key={item.cv_id}
                onClick={() => item.status === 'completed' && navigate(`/analysis/${item.cv_id}`)}
                className={`surface p-4 flex items-center gap-4 transition-shadow ${
                  item.status === 'completed' ? 'cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] group' : ''
                }`}
              >
                <div className="p-2 rounded-lg flex-shrink-0" style={{ background: 'var(--color-card-border)', color: 'var(--color-muted)' }}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-foreground)' }}>{item.original_filename}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    {item.target_domain && <span className="mr-2">{item.target_domain}</span>}
                    {new Date(item.uploaded_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                {item.overall_score !== null ? (
                  <ScoreDot score={item.overall_score} />
                ) : (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.status === 'failed' ? 'text-red-600 bg-red-50' : ''
                  }`} style={item.status !== 'failed' ? { color: 'var(--color-muted)', background: 'var(--color-card-border)' } : {}}>
                    {item.status}
                  </span>
                )}
                {item.status === 'completed' && (
                  <ChevronRight className="w-4 h-4 flex-shrink-0 transition-colors" style={{ color: 'var(--color-muted-foreground)' }} />
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
            <h2 className="font-semibold text-[#111111] text-sm flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#1B3A6B]" />
              Analyze New CV
            </h2>
            <p className="text-xs text-[#787774] mt-1">Upload your resume and get instant AI feedback</p>
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
