import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { CVUploader } from '../../components/cv/CVUploader';
import api from '../../services/api';
import { FileText, Activity, TrendingUp, Shield, Lock, Sparkles } from 'lucide-react';

interface DashboardStats {
  total_cvs: number;
  total_analyses: number;
  average_score: number | null;
  latest_score: number | null;
}

export function DashboardPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/summary');
        setStats(response.data);
        await refreshUser(); // Update quota values natively
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-in slide-up">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-[var(--color-muted)] mt-1">
            Welcome back, <span className="text-[var(--color-primary)] font-medium">{user?.full_name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/hq-portal')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-all"
            >
              <Shield className="w-4 h-4" />
              Admin Panel
            </button>
          )}
          <button 
            onClick={logout}
            className="text-sm font-medium text-[var(--color-muted)] hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Card className="flex flex-col gap-4 justify-center h-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-muted)]">Uploaded CVs</p>
                <h3 className="text-3xl font-bold text-white">{stats?.total_cvs || 0}</h3>
              </div>
            </div>
          </Card>
          
          <Card className="flex flex-col gap-4 justify-center h-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-muted)]">Avg Match Score</p>
                <h3 className="text-3xl font-bold text-white">
                  {stats?.average_score != null ? `${stats.average_score}%` : 'N/A'}
                </h3>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-4 justify-center h-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-muted)]">Total Analyses</p>
                <h3 className="text-3xl font-bold text-white">{stats?.total_analyses || 0}</h3>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-3 justify-center h-full relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-[var(--color-muted)] flex items-center gap-2">
                  Remaining Analyses
                  {user?.plan_type === 'premium' && <span className="bg-amber-500/20 text-amber-500 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">PRO</span>}
                </p>
                <h3 className="text-3xl font-bold text-white mt-1">
                  {Math.max(0, (user?.plan_type === 'premium' ? 50 : 3) - (user?.analysis_count || 0))} 
                  <span className="text-lg text-zinc-500"> / {user?.plan_type === 'premium' ? 50 : 3}</span>
                </h3>
              </div>
              <div className={`p-2.5 rounded-xl ${user?.plan_type === 'premium' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                {user?.plan_type === 'premium' ? <Sparkles className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
            </div>
            
            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${user?.plan_type === 'premium' ? 'bg-amber-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.max(0, Math.min((((user?.plan_type === 'premium' ? 50 : 3) - (user?.analysis_count || 0)) / (user?.plan_type === 'premium' ? 50 : 3)) * 100, 100))}%` }}
              />
            </div>
            
            {user?.plan_type === 'free' && (
              <div className="mt-1">
                <button className="w-full py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 border border-indigo-500/50 text-white text-xs font-bold hover:shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all">
                  Upgrade Plan
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="w-full">
        <h2 className="text-xl font-bold text-white mb-4">Analyze New CV</h2>
        <CVUploader onUploadSuccess={(cvId) => navigate(`/analysis/${cvId}`)} />
      </div>

    </div>
  );
}
