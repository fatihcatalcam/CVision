import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import api from '../../services/api';
import {
  Users, FileText, Activity, TrendingUp, Shield, Trash2,
  ArrowLeft, Crown, User, Loader2, LayoutDashboard, Database,
  Eye, Search, ScrollText, Coins, X, Gift, AlertTriangle, Type,
} from 'lucide-react';
import { PDFViewerModal } from '../../components/analysis/PDFViewerModal';

// Recharts for Data Visualization
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell
} from 'recharts';

interface AdminOverview {
  total_users: number;
  total_cvs: number;
  total_analyses: number;
  average_system_score: number | null;
  free_users: number;
  premium_users: number;
  new_users_this_week: number;
  new_analyses_this_week: number;
  ai_enhanced_count: number;
  credits_in_circulation: number;
  credits_spent_this_week: number;
  paying_users: number;
  jobs_in_flight: number;
  stuck_jobs: number;
  charset_loss_count: number;
  score_distribution: { low: number; medium: number; high: number };
  top_domains: { domain: string; count: number }[];
  daily_activity: { date: string; analyses: number; signups: number }[];
  recent_activities: RecentActivity[];
}

interface UserItem {
  id: number;
  full_name: string;
  email: string;
  role: string;
  plan_type: string;
  credits: number;
  created_at: string;
}

interface RecentActivity {
  id: string | number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

interface LedgerEntry {
  id: number;
  delta: number;
  balance_after: number;
  reason: string;
  ref_id: string | null;
  created_at: string;
}

interface ReferralInvitee {
  id: number;
  full_name: string;
  email: string;
  joined_at: string;
  rewarded_at: string | null;
  analyses: number;
}

interface ReferralGroup {
  inviter_id: number;
  inviter_name: string;
  inviter_email: string;
  invited: number;
  rewarded: number;
  credits_earned: number;
  invitees: ReferralInvitee[];
}

interface ReferralsResponse {
  groups: ReferralGroup[];
  total_rewarded: number;
  total_credits_paid: number;
}

// One page of users or analyses. Small enough that a page is scannable without
// scrolling past the header.
const PAGE_SIZE = 25;

// Mirrors CREDIT_REFERRAL in backend/app/config.py - copy in the explainer only.
const REFERRAL_REWARD = 3;

/**
 * A user's credit statement.
 *
 * The endpoint has existed since the credit switch and nothing called it, so
 * "where did my credits go" had no answer short of opening the database. Every
 * grant, spend, refund and support adjustment is in here with the balance it
 * left behind, which is also how an adjustment gets audited afterwards.
 */
function CreditLedgerModal({ user, onClose }: { user: UserItem; onClose: () => void }) {
  const [entries, setEntries] = useState<LedgerEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.get(`/hq-portal/users/${user.id}/credits?limit=200`)
      .then((res) => setEntries(res.data))
      .catch(() => setFailed(true));
  }, [user.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-zinc-800">
          <div>
            <h3 className="text-white font-bold">{user.full_name}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{user.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xl font-bold text-white font-mono">{user.credits}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Balance</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto">
          {failed ? (
            <p className="p-8 text-center text-sm text-red-400">Could not load the ledger.</p>
          ) : entries === null ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-600" /></div>
          ) : entries.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-500">No credit movements yet.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-zinc-800/60 last:border-0">
                    <td className="px-5 py-2.5 w-16">
                      <span className={`font-mono text-sm font-bold ${e.delta > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                        {e.delta > 0 ? `+${e.delta}` : e.delta}
                      </span>
                    </td>
                    <td className="px-2 py-2.5">
                      <p className="text-sm text-zinc-200">{e.reason.replace(/_/g, ' ')}</p>
                      {e.ref_id && <p className="text-[11px] text-zinc-600 font-mono">{e.ref_id}</p>}
                    </td>
                    <td className="px-2 py-2.5 text-right text-xs text-zinc-500 font-mono w-20">
                      → {e.balance_after}
                    </td>
                    <td className="px-5 py-2.5 text-right text-xs text-zinc-600 whitespace-nowrap w-32">
                      {new Date(e.created_at).toLocaleString('tr-TR', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/** Shared by the user and content tables, which are both server-paged. */
function Pager({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;

  const from = page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-card-border)]">
      <span className="text-xs text-zinc-500">{from}–{to} of {total}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 0}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-card-border)] text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          Previous
        </button>
        <span className="text-xs text-zinc-500 font-mono">{page + 1} / {pages}</span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page + 1 >= pages}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-card-border)] text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

interface AnalysisItem {
  // Failed uploads are listed too, and they have no analysis record -
  // hence the nullable id and score. `status` says which outcome this row is.
  id: number | null;
  cv_id: number;
  // Hashid form of cv_id - what /analysis/:id expects. cv_id stays raw because
  // the admin CV-file route is keyed on the integer.
  cv_hash: string;
  user_email: string;
  user_name: string;
  cv_filename: string;
  role_profile: string;
  score: number | null;
  status: string;
  created_at: string;
}


export function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'users' | 'referrals'>('dashboard');

  // Data States
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [referrals, setReferrals] = useState<ReferralsResponse | null>(null);

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | string | null>(null);
  const [viewingCvId, setViewingCvId] = useState<number | null>(null);
  const [viewingCvMeta, setViewingCvMeta] = useState<{ filename: string; user: string } | null>(null);
  const [ledgerFor, setLedgerFor] = useState<UserItem | null>(null);

  // Search / Filters / paging.
  //
  // The search box used to filter the rows already in the browser, which meant
  // it could only ever find someone inside the first hundred accounts - and
  // said nothing when it could not. It now goes to the server, so `page` and
  // `total` come back with the results.
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // A new search or filter has to start from the first page; staying on page 4
  // of the old result set shows an empty table for a query that has matches.
  useEffect(() => { setPage(0); }, [debouncedQuery, statusFilter, activeTab]);

  useEffect(() => {
    fetchData();
  }, [activeTab, debouncedQuery, statusFilter, page]);

  const fetchData = async () => {
    setIsLoading(true);
    const paging = `skip=${page * PAGE_SIZE}&limit=${PAGE_SIZE}`;
    const search = debouncedQuery ? `&q=${encodeURIComponent(debouncedQuery)}` : '';
    try {
      if (activeTab === 'dashboard') {
        const res = await api.get('/hq-portal/overview');
        setOverview(res.data);
      } else if (activeTab === 'users') {
        const usersRes = await api.get(`/hq-portal/users?${paging}${search}`);
        setUsers(usersRes.data.users);
        setTotal(usersRes.data.total);
      } else if (activeTab === 'content') {
        const status = statusFilter ? `&status=${statusFilter}` : '';
        const analysesRes = await api.get(`/hq-portal/analyses?${paging}${search}${status}`);
        setAnalyses(analysesRes.data.items);
        setTotal(analysesRes.data.total);
      } else if (activeTab === 'referrals') {
        const res = await api.get('/hq-portal/referrals');
        setReferrals(res.data);
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
      await api.patch(`/hq-portal/users/${userId}/role?role=${newRole}`);
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
      await api.delete(`/hq-portal/users/${userId}`);
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
      await api.delete(`/hq-portal/analyses/${analysisId}`);
      setAnalyses(prev => prev.filter(a => a.id !== analysisId));
      setDeleteConfirm(null);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete analysis');
    } finally {
      setActionLoading(null);
    }
  };

  // Support adjustments go through the same endpoint everything else does, so
  // they land in the credit ledger rather than silently moving a column.
  const handleCreditAdjust = async (userId: number, delta: number) => {
    setActionLoading(`credits-${userId}`);
    try {
      const { data } = await api.patch(`/hq-portal/users/${userId}/credits?delta=${delta}`);
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, credits: data.credits } : u)));
    } catch (error: any) {
      alert(error.response?.data?.detail || error.response?.data?.message || 'Adjustment failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewCV = async (cvId: number, filename: string, userName: string) => {
    setViewingCvMeta({ filename, user: userName });
    setViewingCvId(cvId);
  };

  

  const scoreDistData = overview ? [
    { name: 'Low (<50)', value: overview.score_distribution.low, fill: '#ef4444' },
    { name: 'Medium (50–79)', value: overview.score_distribution.medium, fill: '#f59e0b' },
    { name: 'High (≥80)', value: overview.score_distribution.high, fill: '#10b981' },
  ] : [];

  const domainChartData = (overview?.top_domains || []).map(d => ({
    name: d.domain.length > 20 ? d.domain.slice(0, 18) + '…' : d.domain,
    count: d.count,
  }));


  const aiRate = overview && overview.total_analyses > 0
    ? Math.round((overview.ai_enhanced_count / overview.total_analyses) * 100)
    : 0;

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
            <h1 className="text-2xl font-bold text-[#111111] dark:text-[#e8e7e4]">Admin</h1>
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

          <button
            onClick={() => setActiveTab('referrals')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'referrals'
                ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
            }`}
          >
            <Gift className="w-5 h-5" />
            <span className="font-medium">Referrals</span>
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

                {/* Row 1 - 6 stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  {/* Total Users */}
                  <Card className="p-5 col-span-1 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                        <Users className="w-4 h-4" />
                      </div>
                      {overview && overview.new_users_this_week > 0 && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">+{overview.new_users_this_week} wk</span>
                      )}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{overview?.total_users || 0}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Total Users</p>
                    </div>
                    {/* The free/pro split lived here. Both halves counted
                        plan_type, which no longer decides anything. */}
                  </Card>

                  {/* Credits.
                      Replaces "Pro Conversion", which divided premium_users by
                      total_users - a ratio of a plan that stopped meaning
                      anything, permanently reading 0%. Spend is the number that
                      answers the same question now: whether the thing being
                      given away is being used. */}
                  <Card className="p-5 col-span-1 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                        <Coins className="w-4 h-4" />
                      </div>
                      {!!overview?.credits_spent_this_week && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-bold">
                          −{overview.credits_spent_this_week} wk
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{overview?.credits_in_circulation || 0}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Credits Held</p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {overview?.paying_users || 0} paid
                      </span>
                    </div>
                  </Card>

                  {/* Jobs in flight. The recovery sweep already re-queues stuck
                      uploads; until now the only way to learn there was a
                      backlog was a user reporting one. */}
                  <Card className="p-5 col-span-1 flex flex-col gap-2">
                    <div className={`p-2 rounded-lg w-fit ${
                      overview?.stuck_jobs ? 'bg-red-500/10 text-red-400' : 'bg-sky-500/10 text-sky-400'
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{overview?.jobs_in_flight || 0}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Jobs In Flight</p>
                    </div>
                    <button
                      onClick={() => { setStatusFilter('in_flight'); setActiveTab('content'); }}
                      className={`text-[10px] px-1.5 py-0.5 rounded w-fit transition-colors ${
                        overview?.stuck_jobs
                          ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                          : 'text-zinc-500 bg-zinc-800/60 hover:bg-zinc-800'
                      }`}
                    >
                      {overview?.stuck_jobs || 0} stuck →
                    </button>
                  </Card>

                  {/* Turkish characters destroyed by the PDF's own font
                      encoding. Found once by chance in a user's report; this is
                      how widespread it actually is. */}
                  <Card className="p-5 col-span-1 flex flex-col gap-2">
                    <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg w-fit">
                      <Type className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{overview?.charset_loss_count || 0}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Charset Loss</p>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      {overview && overview.total_analyses > 0
                        ? `${Math.round((overview.charset_loss_count / overview.total_analyses) * 100)}% of analyses`
                        : 'no analyses yet'}
                    </span>
                  </Card>

                  {/* Total CVs */}
                  <Card className="p-5 col-span-1 flex flex-col gap-2">
                    <div className="p-2 bg-violet-500/10 text-violet-400 rounded-lg w-fit">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{overview?.total_cvs || 0}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">CVs Uploaded</p>
                    </div>
                  </Card>

                  {/* Total Analyses */}
                  <Card className="p-5 col-span-1 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                        <Activity className="w-4 h-4" />
                      </div>
                      {overview && overview.new_analyses_this_week > 0 && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">+{overview.new_analyses_this_week} wk</span>
                      )}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{overview?.total_analyses || 0}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Total Analyses</p>
                    </div>
                  </Card>

                  {/* Avg Score */}
                  <Card className="p-5 col-span-1 flex flex-col gap-2">
                    <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg w-fit">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {overview?.average_system_score != null ? `${overview.average_system_score}%` : 'N/A'}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">Avg Score</p>
                    </div>
                  </Card>

                  {/* AI Enhanced */}
                  <Card className="p-5 col-span-1 flex flex-col gap-2">
                    <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg w-fit">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{aiRate}%</p>
                      <p className="text-xs text-zinc-500 mt-0.5">AI Enhanced</p>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1 mt-1">
                      <div className="bg-pink-500 h-1 rounded-full transition-all" style={{ width: `${aiRate}%` }} />
                    </div>
                  </Card>
                </div>

                {/* Row 2 - Daily Activity chart + Score Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="col-span-1 lg:col-span-2 p-6 flex flex-col">
                    <h2 className="text-sm font-bold text-zinc-300 mb-5">Daily Activity - Last 14 Days</h2>
                    <div className="flex-1 min-h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={overview?.daily_activity || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="date" stroke="#52525b" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false}
                            tickFormatter={(v) => v.slice(5)} interval={1} />
                          <YAxis stroke="#52525b" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                            labelStyle={{ color: '#a1a1aa' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', color: '#71717a' }} />
                          <Line type="monotone" dataKey="analyses" stroke="#6366f1" strokeWidth={2} dot={false} name="Analyses" />
                          <Line type="monotone" dataKey="signups" stroke="#10b981" strokeWidth={2} dot={false} name="Signups" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="p-6 flex flex-col">
                    <h2 className="text-sm font-bold text-zinc-300 mb-5">Score Distribution</h2>
                    <div className="flex-1 min-h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scoreDistData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                          <XAxis type="number" stroke="#52525b" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <YAxis type="category" dataKey="name" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
                            {scoreDistData.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>

                {/* Row 3 - Top Domains + Activity Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="col-span-1 lg:col-span-2 p-6 flex flex-col">
                    <h2 className="text-sm font-bold text-zinc-300 mb-5">Top Domains</h2>
                    {domainChartData.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">No domain data yet</div>
                    ) : (
                      <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={domainChartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                            <XAxis type="number" stroke="#52525b" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <YAxis type="category" dataKey="name" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} />
                            <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={24} name="Analyses" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </Card>

                  {/* Activity Feed */}
                  <Card className="col-span-1 p-0 flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-[var(--color-card-border)] bg-[rgba(255,255,255,0.02)]">
                      <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-400" />
                        Recent Activity
                      </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[250px] p-2">
                      {(overview?.recent_activities || []).length === 0 ? (
                        <div className="p-6 text-center text-zinc-500 text-sm">No recent activity.</div>
                      ) : (
                        <div className="flex flex-col">
                          {(overview?.recent_activities || []).map((act) => (
                            <div key={act.id} className="p-3 hover:bg-zinc-800/50 rounded-xl transition-colors flex gap-3 group">
                              <div className={`mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full ${act.type === 'user' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                              <div>
                                <h4 className="text-xs font-semibold text-zinc-200">{act.title}</h4>
                                <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{act.description}</p>
                                <span className="text-[10px] text-zinc-600 mt-1 block">
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
                  <h2 className="text-2xl font-bold text-[#111111] dark:text-[#e8e7e4]">Analyzed Content</h2>
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

                {/* Status filter. Runs on the server, so "show me the failures"
                    reaches past the newest page rather than filtering the rows
                    that happen to be loaded. */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: '', label: 'All' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'in_flight', label: 'In flight' },
                    { value: 'failed', label: 'Failed' },
                    { value: 'failed_no_text', label: 'Image PDF' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setStatusFilter(value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        statusFilter === value
                          ? 'bg-zinc-800 text-white border-zinc-600'
                          : 'border-[var(--color-card-border)] text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
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
                        {analyses.length === 0 ? (
                          <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No content found</td></tr>
                        ) : analyses.map((a) => {
                          // Captured as a const so the null check narrows inside
                          // the onClick closures too (property narrowing does not
                          // survive into nested functions).
                          const analysisId = a.id;
                          return (
                          <tr key={a.cv_id} className="border-b border-[var(--color-card-border)] last:border-0 hover:bg-white/[0.02] transition-colors">
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
                              {a.score !== null ? (
                                <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold ${
                                  a.score >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                                  a.score >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {a.score}%
                                </span>
                              ) : (
                                // No analysis: say why, so a wrongly-rejected CV
                                // is obvious and can be opened via "View CV PDF".
                                <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold ${
                                  a.status === 'failed_no_text' ? 'bg-amber-500/10 text-amber-400' :
                                  a.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                                  'bg-zinc-500/10 text-zinc-400'
                                }`}>
                                  {a.status === 'failed_no_text' ? 'Image PDF'
                                    : a.status === 'failed' ? 'Failed'
                                    : a.status}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-zinc-500 text-sm">{new Date(a.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right">
                              {analysisId !== null && deleteConfirm === `a-${analysisId}` ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => handleDeleteAnalysis(analysisId)} disabled={actionLoading === `del-analysis-${analysisId}`} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                                    {actionLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Confirm'}
                                  </button>
                                  <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">Cancel</button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  {/* Always available - this is how a failed upload gets audited. */}
                                  <button onClick={() => handleViewCV(a.cv_id, a.cv_filename, a.user_name)} className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="View CV PDF">
                                    <ScrollText className="w-4 h-4" />
                                  </button>
                                  {/* No analysis record on a failed upload: nothing to open or delete. */}
                                  {analysisId !== null && (
                                    <>
                                      {/* A real <Link>, not a modal: it opens the
                                          same report the user sees, and having an
                                          href means ctrl/middle-click keeps this
                                          list open in the current tab. */}
                                      <Link to={`/analysis/${a.cv_hash}`} className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors inline-flex" title="View Analysis Report">
                                        <Eye className="w-4 h-4" />
                                      </Link>
                                      <button onClick={() => setDeleteConfirm(`a-${analysisId}`)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pager page={page} total={total} onPage={setPage} />
                </Card>
              </div>
            )}

            {/* TAB: USERS */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#111111] dark:text-[#e8e7e4]">User Management</h2>
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

                {/* Seven columns at px-6, three action buttons and a separate
                    Email column pushed the table past the viewport, so the
                    controls on the right could only be reached by scrolling
                    sideways - they were effectively invisible.

                    Two of those columns were also dead. Plan showed plan_type,
                    which gates nothing since credits, and "Give Premium" handed
                    out a status that buys nothing. Email now sits under the
                    name, where it costs no width at all. */}
                <Card noPadding>
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-[var(--color-card-border)] bg-[rgba(255,255,255,0.02)]">
                        <th className="px-4 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">User</th>
                        <th className="w-28 px-3 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Role</th>
                        <th className="w-36 px-3 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Credits</th>
                        <th className="w-28 px-3 py-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Joined</th>
                        <th className="w-52 px-4 py-4 text-right text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                         <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">No users found</td></tr>
                      ) : users.map((u) => (
                        <tr key={u.id} className="border-b border-[var(--color-card-border)] last:border-0 hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${u.role === 'admin' ? 'bg-amber-500/15 text-amber-400' : 'bg-indigo-500/15 text-indigo-400'}`}>
                                {u.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-medium text-sm truncate">{u.full_name}</p>
                                <p className="text-zinc-500 text-xs truncate" title={u.email}>{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}`}>
                              {u.role === 'admin' ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                              {u.role}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-1.5">
                              {/* The balance opens the statement behind it. */}
                              <button
                                onClick={() => setLedgerFor(u)}
                                title="Credit ledger"
                                className="text-white font-mono text-sm w-7 text-right hover:text-amber-400 hover:underline transition-colors"
                              >
                                {u.credits}
                              </button>
                              <button
                                onClick={() => handleCreditAdjust(u.id, 10)}
                                disabled={actionLoading === `credits-${u.id}`}
                                title="Give 10 credits"
                                className="px-1.5 py-0.5 rounded text-[11px] font-bold border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50 transition-colors"
                              >+10</button>
                              <button
                                onClick={() => handleCreditAdjust(u.id, -10)}
                                disabled={actionLoading === `credits-${u.id}`}
                                title="Take back 10 credits"
                                className="px-1.5 py-0.5 rounded text-[11px] font-bold border border-zinc-700 text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                              >-10</button>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-zinc-500 text-xs whitespace-nowrap">{new Date(u.created_at).toLocaleDateString('tr-TR')}</td>
                          <td className="px-4 py-4 text-right">
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
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-card-border)] text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50 whitespace-nowrap"
                                  >
                                    {actionLoading === `user-${u.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : (u.role === 'admin' ? 'Remove Admin' : 'Make Admin')}
                                  </button>
                                  <button onClick={() => setDeleteConfirm(`u-${u.id}`)} title="Delete user" className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
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
                  <Pager page={page} total={total} onPage={setPage} />
                </Card>
              </div>
            )}

            {/* TAB: REFERRALS */}
            {activeTab === 'referrals' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#111111] dark:text-[#e8e7e4]">Referrals</h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    An invite pays {REFERRAL_REWARD} credits once the invitee finishes their first
                    analysis. A long list of invitees with no analyses is someone
                    trying, not someone earning.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-5">
                    <p className="text-2xl font-bold text-white">{referrals?.total_rewarded ?? 0}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Invites paid out</p>
                  </Card>
                  <Card className="p-5">
                    <p className="text-2xl font-bold text-white">{referrals?.total_credits_paid ?? 0}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Credits given away</p>
                  </Card>
                </div>

                {!referrals || referrals.groups.length === 0 ? (
                  <Card className="p-8 text-center text-zinc-500 text-sm">
                    Nobody has signed up through an invite link yet.
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {referrals.groups.map((g) => (
                      <Card key={g.inviter_id} noPadding>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-card-border)]">
                          <div>
                            <p className="text-white font-medium text-sm">{g.inviter_name}</p>
                            <p className="text-zinc-500 text-xs">{g.inviter_email}</p>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-zinc-400">{g.invited} invited</span>
                            <span className="text-emerald-400">{g.rewarded} paid</span>
                            <span className="text-amber-400 font-mono font-bold">+{g.credits_earned}</span>
                          </div>
                        </div>
                        <table className="w-full text-left border-collapse">
                          <tbody>
                            {g.invitees.map((m) => (
                              <tr key={m.id} className="border-b border-zinc-800/50 last:border-0">
                                <td className="px-5 py-2.5">
                                  <p className="text-sm text-zinc-300">{m.full_name}</p>
                                  <p className="text-[11px] text-zinc-600">{m.email}</p>
                                </td>
                                <td className="px-2 py-2.5 text-xs text-zinc-500 whitespace-nowrap">
                                  {new Date(m.joined_at).toLocaleDateString('tr-TR')}
                                </td>
                                <td className="px-2 py-2.5 text-xs whitespace-nowrap">
                                  {/* Zero analyses is the tell: the reward only
                                      fires after the first one, so these are
                                      accounts that signed up and stopped. */}
                                  <span className={m.analyses === 0 ? 'text-amber-400' : 'text-zinc-500'}>
                                    {m.analyses} CV
                                  </span>
                                </td>
                                <td className="px-5 py-2.5 text-right text-xs whitespace-nowrap">
                                  {m.rewarded_at
                                    ? <span className="text-emerald-400">paid</span>
                                    : <span className="text-zinc-600">unpaid</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>

      {ledgerFor && (
        <CreditLedgerModal user={ledgerFor} onClose={() => setLedgerFor(null)} />
      )}

      {/* CV PDF Viewer Modal - reuses the same component as the analysis page */}
      <PDFViewerModal
        isOpen={viewingCvId !== null}
        onClose={() => { setViewingCvId(null); setViewingCvMeta(null); }}
        fileUrl={viewingCvId !== null ? `/hq-portal/cvs/${viewingCvId}/file` : undefined}
        subtitle={viewingCvMeta ? `${viewingCvMeta.user} · ${viewingCvMeta.filename}` : undefined}
      />
    </div>
  );
}
