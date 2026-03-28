import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import api from '../../services/api';
import { FileText, Activity, TrendingUp } from 'lucide-react';

interface DashboardStats {
  total_cvs: number;
  total_analyses: number;
  average_score: number | null;
  latest_score: number | null;
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/summary');
        setStats(response.data);
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
        <button 
          onClick={logout}
          className="text-sm font-medium text-[var(--color-muted)] hover:text-white transition-colors"
        >
          Sign Out
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="flex flex-col gap-4">
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
          
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-muted)]">Average Match Score</p>
                <h3 className="text-3xl font-bold text-white">
                  {stats?.average_score != null ? `${stats.average_score}%` : 'N/A'}
                </h3>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
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
        </div>
      )}

      <Card>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="w-16 h-16 text-[var(--color-muted-foreground)] mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-white mb-2">No Recent Activity</h2>
          <p className="text-[var(--color-muted)] max-w-md mb-6">
            Upload a new CV to run the analysis engine, extract skills, and get targeted career recommendations.
          </p>
          <button className="px-6 py-3 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium transition-colors shadow-lg shadow-blue-500/20">
            Upload New CV
          </button>
        </div>
      </Card>
    </div>
  );
}
