import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import api from '../../services/api';
import {
  Users, FileText, Activity, TrendingUp, Shield, Trash2,
  ArrowLeft, Crown, User, Loader2, LayoutDashboard, Database,
  Eye, Search
} from 'lucide-react';
import { AdminAnalysisViewer } from '../../components/admin/AdminAnalysisViewer';

// Recharts for Data Visualization
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface AdminStats {
  total_users: number;
  total_cvs: number;
  total_analyses: number;
  average_system_score: number | null;
}

interface UserItem {
  id: number;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface RecentActivity {
  id: string | number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

interface AnalysisItem {
  id: number;
  user_email: string;
  user_name: string;
  cv_filename: string;
  role_profile: string;
  score: number;
  created_at: string;
}

export function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'users'>('dashboard');

  // Data States
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | string | null>(null);
  const [viewingAnalysis, setViewingAnalysis] = useState<number | null>(null);
  
  // Search / Filters
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]); // Refetch when tab changes to refresh data

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const [statsRes, actRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/recent-activity')
        ]);
        setStats(statsRes.data);
        setActivities(actRes.data);
      } else if (activeTab === 'users') {
        const usersRes = await api.get('/admin/users?limit=100');
        setUsers(usersRes.data.users);
      } else if (activeTab === 'content') {
        const analysesRes = await api.get('/admin/analyses?limit=100');
        setAnalyses(analysesRes.data.items);
      }
    } catch (error: any) {
      if (error.response?.status === 403) navigate('/dashboard');
      console.error('Failed to fetch admin data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    setActionLoading(`user-${userId}`);
    try {
      await api.patch(`/admin/users/${userId}/role?role=${newRole}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to change role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setActionLoading(`del-user-${userId}`);
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setDeleteConfirm(null);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAnalysis = async (analysisId: number) => {
    setActionLoading(`del-analysis-${analysisId}`);
    try {
      await api.delete(`/admin/analyses/${analysisId}`);
      setAnalyses(prev => prev.filter(a => a.id !== analysisId));
      setDeleteConfirm(null);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete analysis');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredAnalyses = analyses.filter(a => 
    a.user_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.cv_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.role_profile.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock chart data based on loaded stats
  const chartData = [
    { name: 'Users', amount: stats?.total_users || 0 },
    { name: 'CVs Uploaded', amount: stats?.total_cvs || 0 },
    { name: 'Total Analyses', amount: stats?.total_analyses || 0 },
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 animate-in slide-up">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
        <div className="mb-6 px-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-[var(--color-muted)] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to App
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-bold text-white">Admin</h1>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] uppercase tracking-wider font-bold">
            <Crown className="w-3 h-3" /> System Administrator
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'dashboard'
                ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard Overview</span>
          </button>
          
          <button
            onClick={() => setActiveTab('content')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'content'
                ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
            }`}
          >
            <Database className="w-5 h-5" />
            <span className="font-medium">Content & CVs</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'users'
                ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">User Management</span>
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        
        {isLoading ? (
          <div className="w-full h-64 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)] opacity-50" />
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Total Users</p>
                        <h3 className="text-2xl font-bold text-white">{stats?.total_users || 0}</h3>
                      </div>
                    </div>
                  </Card>
                  <Card className="flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Total CVs</p>
                        <h3 className="text-2xl font-bold text-white">{stats?.total_cvs || 0}</h3>
                      </div>
                    </div>
                  </Card>
                  <Card className="flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Analyses</p>
                        <h3 className="text-2xl font-bold text-white">{stats?.total_analyses || 0}</h3>
                      </div>
                    </div>
                  </Card>
                  <Card className="flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Avg Score</p>
                        <h3 className="text-2xl font-bold text-white">
                          {stats?.average_system_score != null ? `${stats.average_system_score}%` : 'N/A'}
                        </h3>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Chart */}
                  <Card className="col-span-1 lg:col-span-2 p-6 flex flex-col">
                    <h2 className="text-lg font-bold text-white mb-6">System Growth</h2>
                    <div className="flex-1 min-h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" vertical={false} />
                          <XAxis dataKey="name" stroke="#71717a" tick={{fill: '#71717a', fontSize: 12}} axisLine={false} tickLine={false} />
                          <YAxis stroke="#71717a" tick={{fill: '#71717a', fontSize: 12}} axisLine={false} tickLine={false} />
                          <Tooltip 
                            cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                            contentStyle={{backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff'}}
                          />
                          <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={60} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Activity Feed */}
                  <Card className="col-span-1 p-0 flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-[var(--color-card-border)] bg-[rgba(255,255,255,0.02)]">
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-400" />
                        Recent Activity
                      </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[350px] p-2">
                      {activities.length === 0 ? (
                        <div className="p-6 text-center text-zinc-500 text-sm">No recent activity detected.</div>
                      ) : (
                        <div className="flex flex-col">
                          {activities.map((act) => (
                            <div key={act.id} className="p-4 hover:bg-zinc-800/50 rounded-xl transition-colors flex gap-4 group">
                              <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${act.type === 'user' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                              <div>
                                <h4 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{act.title}</h4>
                                <p className="text-xs text-zinc-500 mt-1">{act.description}</p>
                                <span className="text-[10px] text-zinc-600 mt-2 block">
                                  {new Date(act.timestamp).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* TAB: CONTENT & ANALYSES */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Analyzed Content</h2>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search files or users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <Card noPadding>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--color-card-border)] bg-[rgba(255,255,255,0.02)]">
                          <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">User</th>
                          <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">CV File</th>
                          <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Target Profile</th>
                          <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Score</th>
                          <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAnalyses.length === 0 ? (
                          <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No content found</td></tr>
                        ) : filteredAnalyses.map((a) => (
                          <tr key={a.id} className="border-b border-[var(--color-card-border)] last:border-0 hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-white font-medium text-sm">{a.user_name}</p>
                              <p className="text-zinc-500 text-xs">{a.user_email}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-400" />
                                <span className="text-zinc-300 text-sm truncate max-w-[150px]">{a.cv_filename}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-zinc-400 text-sm">{a.role_profile}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold ${
                                a.score >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                                a.score >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                              }`}>
                                {a.score}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-500 text-sm">{new Date(a.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right">
                              {deleteConfirm === `a-${a.id}` ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => handleDeleteAnalysis(a.id)} disabled={actionLoading === `del-analysis-${a.id}`} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                                    {actionLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Confirm'}
                                  </button>
                                  <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">Cancel</button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => setViewingAnalysis(a.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors" title="View Detailed Report">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setDeleteConfirm(`a-${a.id}`)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB: USERS */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">User Management</h2>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <Card noPadding>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--color-card-border)] bg-[rgba(255,255,255,0.02)]">
                          <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">User</th>
                          <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Email</th>
                          <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Role</th>
                          <th className="px-6 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Joined</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 ? (
                           <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No users found</td></tr>
                        ) : filteredUsers.map((u) => (
                          <tr key={u.id} className="border-b border-[var(--color-card-border)] last:border-0 hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${u.role === 'admin' ? 'bg-amber-500/15 text-amber-400' : 'bg-indigo-500/15 text-indigo-400'}`}>
                                  {u.full_name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-white font-medium text-sm">{u.full_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-zinc-400 text-sm">{u.email}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}`}>
                                {u.role === 'admin' ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-500 text-sm">{new Date(u.created_at).toLocaleDateString('tr-TR')}</td>
                            <td className="px-6 py-4 text-right">
                              {u.id !== user?.id ? (
                                deleteConfirm === `u-${u.id}` ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => handleDeleteUser(u.id)} disabled={actionLoading === `del-user-${u.id}`} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                                      Confirm
                                    </button>
                                    <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">Cancel</button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'user' : 'admin')}
                                      disabled={actionLoading === `user-${u.id}`}
                                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-card-border)] text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                                    >
                                      {actionLoading === `user-${u.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : (u.role === 'admin' ? 'Demote' : 'Make Admin')}
                                    </button>
                                    <button onClick={() => setDeleteConfirm(`u-${u.id}`)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )
                              ) : (
                                <span className="text-xs text-zinc-500 italic pr-2">You</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
            
          </div>
        )}
      </div>

      {/* Admin Analysis Viewer Modal */}
      {viewingAnalysis !== null && (
        <AdminAnalysisViewer
          analysisId={viewingAnalysis}
          isOpen={true}
          onClose={() => setViewingAnalysis(null)}
        />
      )}
    </div>
  );
}
