import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import api from '../../services/api';
import {
  Users, FileText, Activity, TrendingUp, Shield, Trash2,
  ArrowLeft, Crown, User, Loader2
} from 'lucide-react';

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

export function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users?limit=100'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
    } catch (error: any) {
      if (error.response?.status === 403) {
        navigate('/dashboard');
      }
      console.error('Failed to fetch admin data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    setActionLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}/role?role=${newRole}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error: any) {
      console.error('Failed to change role', error);
      alert(error.response?.data?.detail || 'Failed to change role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setActionLoading(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setDeleteConfirm(null);
      if (stats) {
        setStats({ ...stats, total_users: stats.total_users - 1 });
      }
    } catch (error: any) {
      console.error('Failed to delete user', error);
      alert(error.response?.data?.detail || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 animate-in slide-up">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-[var(--color-muted)] hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-7 h-7 text-amber-400" />
              <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            </div>
            <p className="text-[var(--color-muted)] mt-1 ml-9">
              System overview & user management
            </p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold flex items-center gap-1.5">
          <Crown className="w-4 h-4" />
          Admin
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <Card className="flex flex-col gap-3">
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

        <Card className="flex flex-col gap-3">
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

        <Card className="flex flex-col gap-3">
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

        <Card className="flex flex-col gap-3">
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

      {/* Users Table */}
      <Card noPadding>
        <div className="px-6 py-5 border-b border-[var(--color-card-border)]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--color-primary)]" />
            User Management
          </h2>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {users.length} registered user{users.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-card-border)]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-[var(--color-card-border)] last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                        ${u.role === 'admin'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                        }
                      `}>
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-muted)] text-sm">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`
                      inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                      ${u.role === 'admin'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        : 'bg-zinc-700/50 text-zinc-300 border border-zinc-600/30'
                      }
                    `}>
                      {u.role === 'admin' ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-muted)] text-sm">
                    {new Date(u.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {u.id !== user?.id && (
                        <>
                          {/* Role Toggle Button */}
                          <button
                            onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'user' : 'admin')}
                            disabled={actionLoading === u.id}
                            className={`
                              px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                              ${u.role === 'admin'
                                ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20'
                              }
                              disabled:opacity-50
                            `}
                            title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                          >
                            {actionLoading === u.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : u.role === 'admin' ? (
                              'Demote'
                            ) : (
                              'Promote'
                            )}
                          </button>

                          {/* Delete Button */}
                          {deleteConfirm === u.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={actionLoading === u.id}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 transition-all disabled:opacity-50"
                              >
                                {actionLoading === u.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  'Confirm'
                                )}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(u.id)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                      {u.id === user?.id && (
                        <span className="text-xs text-[var(--color-muted)] italic">You</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
