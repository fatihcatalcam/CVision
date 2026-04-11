import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import api from '../../services/api';
import {
  ArrowLeft, FileText, ChevronRight, Search, Filter,
  TrendingUp, Clock, CheckCircle2, XCircle, Loader2,
  BarChart3, Trash2, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface HistoryItem {
  cv_id: number;
  original_filename: string;
  target_domain: string | null;
  status: string;
  uploaded_at: string;
  overall_score: number | null;
  ats_score: number | null;
  keyword_score: number | null;
  analysis_id: number | null;
}

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  completed: {
    label: 'Completed',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  processing: {
    label: 'Processing',
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  pending: {
    label: 'Pending',
    icon: <Clock className="w-3.5 h-3.5" />,
    color: 'text-zinc-400',
    bg: 'bg-zinc-800 border-zinc-700',
  },
  failed: {
    label: 'Failed',
    icon: <XCircle className="w-3.5 h-3.5" />,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
  },
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
    score >= 60 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
    'text-red-400 bg-red-500/10 border-red-500/20';

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-black border ${color} stat-number`}>
      {Math.round(score)}%
    </span>
  );
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-xs text-zinc-500 stat-number w-8 text-right">{Math.round(value)}%</span>
    </div>
  );
}

export function HistoryPage() {
  useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const PAGE_SIZE = 20;

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/dashboard/history?limit=${PAGE_SIZE}&skip=0`);
        setItems(res.data.items);
        setTotal(res.data.total);
      } catch {
        toast.error('Failed to load history');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const handleDelete = async (cvId: number) => {
    setDeletingId(cvId);
    try {
      await api.delete(`/cvs/${cvId}`);
      setItems(prev => prev.filter(i => i.cv_id !== cvId));
      setTotal(prev => prev - 1);
      setConfirmDelete(null);
      toast.success('CV deleted');
    } catch {
      toast.error('Failed to delete CV');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = items.filter(item => {
    const matchSearch =
      item.original_filename.toLowerCase().includes(search.toLowerCase()) ||
      (item.target_domain ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const avgScore = items
    .filter(i => i.overall_score !== null)
    .reduce((acc, i, _, arr) => acc + (i.overall_score! / arr.length), 0);

  const bestScore = Math.max(...items.filter(i => i.overall_score !== null).map(i => i.overall_score!), 0);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-in slide-up">

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white">Analysis History</h1>
            <p className="text-zinc-500 text-sm mt-1">{total} CV{total !== 1 ? 's' : ''} uploaded total</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 transition-all self-start sm:self-auto"
          >
            <FileText className="w-4 h-4" /> New Analysis
          </button>
        </div>
      </div>

      {/* Summary stats */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total CVs', value: total, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Avg Score', value: avgScore > 0 ? `${Math.round(avgScore)}%` : 'N/A', icon: BarChart3, color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { label: 'Best Score', value: bestScore > 0 ? `${Math.round(bestScore)}%` : 'N/A', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Completed', value: items.filter(i => i.status === 'completed').length, icon: CheckCircle2, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map(s => (
            <Card key={s.label} className="flex items-center gap-3 p-4 hover:border-white/10 transition-all">
              <div className={`p-2 rounded-xl ${s.bg} flex-shrink-0`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">{s.label}</p>
                <p className="text-xl font-black text-white stat-number">{s.value}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by filename or domain..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[rgba(15,15,24,0.8)] border border-[var(--color-card-border)] rounded-xl h-10 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="appearance-none bg-[rgba(15,15,24,0.8)] border border-[var(--color-card-border)] rounded-xl h-10 pl-9 pr-8 text-sm text-white cursor-pointer focus:outline-none focus:border-indigo-500/60 transition-all"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="glass-card rounded-2xl h-20 shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {items.length === 0 ? 'No analyses yet' : 'No results found'}
          </h3>
          <p className="text-zinc-500 text-sm mb-6">
            {items.length === 0
              ? 'Upload your first CV to get started.'
              : 'Try adjusting your search or filter.'}
          </p>
          {items.length === 0 && (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold hover:-translate-y-0.5 transition-all"
            >
              Upload CV
            </button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const meta = STATUS_META[item.status] ?? STATUS_META.pending;
            const canView = item.status === 'completed' && item.cv_id;
            const isDeleting = deletingId === item.cv_id;
            const isConfirming = confirmDelete === item.cv_id;

            return (
              <div
                key={item.cv_id}
                className="glass-card rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4 p-4 sm:p-5">
                  {/* File icon */}
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${canView ? 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20' : 'bg-zinc-900 text-zinc-600'} transition-colors`}>
                    <FileText className="w-5 h-5" />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-semibold text-sm truncate max-w-[200px] sm:max-w-none">
                        {item.original_filename}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.bg} ${meta.color}`}>
                        {meta.icon} {meta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {item.target_domain && (
                        <span className="text-xs text-zinc-500">{item.target_domain}</span>
                      )}
                      <span className="text-xs text-zinc-700">
                        {new Date(item.uploaded_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Scores */}
                  {item.overall_score !== null && (
                    <div className="hidden md:flex flex-col gap-1.5 min-w-[140px]">
                      <div className="flex items-center justify-between text-[10px] text-zinc-600 mb-0.5">
                        <span>ATS</span>
                        <span>Keywords</span>
                      </div>
                      <MiniBar value={item.ats_score ?? 0} color="bg-blue-500" />
                      <MiniBar value={item.keyword_score ?? 0} color="bg-violet-500" />
                    </div>
                  )}

                  {/* Score badge */}
                  <div className="flex-shrink-0">
                    {item.overall_score !== null ? (
                      <ScoreBadge score={item.overall_score} />
                    ) : item.status === 'failed' ? (
                      <span className="text-xs text-red-400/60">Failed</span>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isConfirming ? (
                      <>
                        <button
                          onClick={() => handleDelete(item.cv_id)}
                          disabled={isDeleting}
                          className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/20 text-xs font-bold hover:bg-red-500/25 transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-medium hover:bg-zinc-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setConfirmDelete(item.cv_id)}
                          className="p-2 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {canView && (
                          <button
                            onClick={() => navigate(`/analysis/${item.cv_id}`)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold hover:bg-indigo-500/20 transition-all"
                          >
                            View Report <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
