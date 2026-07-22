import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import {
  ArrowLeft, FileText, ChevronRight, Search, Filter,
  TrendingUp, Clock, CheckCircle2, XCircle, Loader2,
  BarChart3, Trash2, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

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

function getStatusMeta(t: (key: string) => string): Record<string, { label: string; icon: React.ReactNode; badgeClass: string }> {
  return {
    completed: {
      label: t('history.filterCompleted'),
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      badgeClass: 'badge badge-success',
    },
    processing: {
      label: t('history.filterProcessing'),
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      badgeClass: 'badge badge-warning',
    },
    pending: {
      label: t('history.filterPending'),
      icon: <Clock className="w-3.5 h-3.5" />,
      badgeClass: 'badge badge-warning',
    },
    failed: {
      label: t('history.filterFailed'),
      icon: <XCircle className="w-3.5 h-3.5" />,
      badgeClass: 'badge badge-danger',
    },
  };
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-[#346538] bg-[#346538]/10 border-[#346538]/20' :
    score >= 60 ? 'text-[#956400] bg-[#956400]/10 border-[#956400]/20' :
    'text-[#9F2F2D] bg-[#9F2F2D]/10 border-[#9F2F2D]/20';

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-black border ${color} stat-number`}>
      {Math.round(score)}%
    </span>
  );
}

function MiniBar({ value }: { value: number }) {
  const bg =
    value >= 80 ? '#346538' : value >= 60 ? '#956400' : '#9F2F2D';
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-[#EAEAEA] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(value, 100)}%`, background: bg }}
        />
      </div>
      <span className="text-xs text-[#787774] stat-number w-8 text-right">{Math.round(value)}%</span>
    </div>
  );
}

export function HistoryPage() {
  const { t, i18n } = useTranslation();
  useAuth();
  const navigate = useNavigate();
  const STATUS_META = getStatusMeta(t);

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/dashboard/history?limit=${PAGE_SIZE}&skip=0`);
        setItems(res.data.items);
        setTotal(res.data.total);
      } catch {
        toast.error(t('history.errorLoad'));
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const handleDelete = async (cvId: string) => {
    setDeletingId(cvId);
    try {
      await api.delete(`/cvs/${cvId}`);
      setItems(prev => prev.filter(i => i.cv_id !== cvId));
      setTotal(prev => prev - 1);
      setConfirmDelete(null);
      toast.success(t('history.successDelete'));
    } catch {
      toast.error(t('history.errorDelete'));
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
          className="flex items-center gap-2 text-sm text-[#787774] dark:text-[#908d89] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" /> {t('history.backToDashboard')}
        </button>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-sans text-2xl tracking-tight text-[#111111] dark:text-[#e8e7e4]">{t('history.title')}</h1>
            <p className="text-[#787774] dark:text-[#908d89] text-sm mt-1">{t('history.totalUploaded', { count: total })}</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-[#1B3A6B] text-white text-sm font-semibold hover:bg-[#122a52] transition-colors self-start sm:self-auto"
          >
            <FileText className="w-4 h-4" /> {t('history.newAnalysis')}
          </button>
        </div>
      </div>

      {/* Summary stats */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: t('history.statTotalCvs'), value: total, icon: FileText, iconColor: 'text-[#1B3A6B]', iconBg: 'bg-[#EEF2F8]' },
            { label: t('history.statAvgScore'), value: avgScore > 0 ? `${Math.round(avgScore)}%` : 'N/A', icon: BarChart3, iconColor: 'text-[#956400]', iconBg: 'bg-[#956400]/10' },
            { label: t('history.statBestScore'), value: bestScore > 0 ? `${Math.round(bestScore)}%` : 'N/A', icon: TrendingUp, iconColor: 'text-[#346538]', iconBg: 'bg-[#346538]/10' },
            { label: t('history.statCompleted'), value: items.filter(i => i.status === 'completed').length, icon: CheckCircle2, iconColor: 'text-[#346538]', iconBg: 'bg-[#346538]/10' },
          ].map(s => (
            <Card key={s.label} className="flex items-center gap-3 p-4 hover:border-[#EAEAEA] transition-all">
              <div className={`p-2 rounded-[var(--radius-md)] ${s.iconBg} flex-shrink-0`}>
                <s.icon className={`w-4 h-4 ${s.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-[#787774] font-medium">{s.label}</p>
                <p className="text-xl font-black text-[#111111] stat-number">{s.value}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A09D9A] pointer-events-none" />
          <input
            type="text"
            placeholder={t('history.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#1c1c1a] border border-[#EAEAEA] dark:border-white/[0.07] text-[#111111] dark:text-[#e8e7e4] placeholder:text-[#A09D9A] dark:placeholder:text-[#6a6764] rounded-[var(--radius-md)] h-10 pl-10 pr-4 text-sm focus:outline-none focus:border-[#1B3A6B] dark:focus:border-[#4a7dd1] focus:ring-2 focus:ring-[#EEF2F8] dark:focus:ring-[#4a7dd1]/20 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A09D9A] pointer-events-none" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="appearance-none bg-white dark:bg-[#1c1c1a] border border-[#EAEAEA] dark:border-white/[0.07] text-[#111111] dark:text-[#e8e7e4] text-sm px-3 py-2 pl-9 pr-8 rounded-[var(--radius-md)] h-10 cursor-pointer focus:outline-none focus:border-[#1B3A6B] dark:focus:border-[#4a7dd1] transition-all"
          >
            <option value="all">{t('history.filterAll')}</option>
            <option value="completed">{t('history.filterCompleted')}</option>
            <option value="processing">{t('history.filterProcessing')}</option>
            <option value="pending">{t('history.filterPending')}</option>
            <option value="failed">{t('history.filterFailed')}</option>
          </select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="surface rounded-[var(--radius-lg)] h-20 shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-16 h-16 rounded-[var(--radius-lg)] bg-[#F7F6F3] dark:bg-white/[0.05] border border-[#EAEAEA] dark:border-white/[0.07] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-[#787774] dark:text-[#908d89]" />
          </div>
          <h3 className="text-lg font-bold text-[#111111] dark:text-[#e8e7e4] mb-2">
            {items.length === 0 ? t('history.emptyHeading') : t('history.emptyFilterHeading')}
          </h3>
          <p className="text-[#787774] text-sm mb-6">
            {items.length === 0
              ? t('history.emptyBody')
              : t('history.emptyFilterBody')}
          </p>
          {items.length === 0 && (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 rounded-[var(--radius-md)] bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] text-sm font-semibold hover:bg-[#2a2a2a] dark:hover:bg-[#d0cfcc] active:scale-[0.98] transition-all"
            >
              {t('history.uploadCv')}
            </button>
          )}
        </Card>
      ) : (
        <div className="surface overflow-hidden" style={{ padding: 0 }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F7F6F3] dark:bg-white/[0.03] border-b border-[#EAEAEA] dark:border-white/[0.07]">
                <th className="px-5 py-3 text-left label-sm">{t('history.colFile')}</th>
                <th className="px-5 py-3 text-left label-sm hidden sm:table-cell">{t('history.colDomain')}</th>
                <th className="px-5 py-3 text-left label-sm hidden md:table-cell">{t('history.colScores')}</th>
                <th className="px-5 py-3 text-left label-sm">{t('history.colScore')}</th>
                <th className="px-5 py-3 text-left label-sm">{t('history.colStatus')}</th>
                <th className="px-5 py-3 text-left label-sm hidden sm:table-cell">{t('history.colDate')}</th>
                <th className="px-5 py-3 text-right label-sm">{t('history.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const meta = STATUS_META[item.status] ?? STATUS_META.pending;
                const canView = item.status === 'completed' && item.cv_id;
                const isDeleting = deletingId === item.cv_id;
                const isConfirming = confirmDelete === item.cv_id;

                return (
                  <tr
                    key={item.cv_id}
                    className="border-b border-[#EAEAEA] dark:border-white/[0.07] hover:bg-[#F7F6F3] dark:hover:bg-white/[0.03] transition-colors cursor-pointer last:border-0"
                    onClick={() => canView && navigate(`/analysis/${item.cv_id}`)}
                  >
                    {/* File */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-[var(--radius-sm)] flex-shrink-0 ${canView ? 'bg-[#EEF2F8] dark:bg-[#1B3A6B]/20 text-[#1B3A6B] dark:text-[#4a7dd1]' : 'bg-[#F7F6F3] dark:bg-white/[0.05] text-[#787774] dark:text-[#908d89]'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-[#111111] dark:text-[#e8e7e4] truncate max-w-[160px] sm:max-w-[220px]">
                          {item.original_filename}
                        </span>
                      </div>
                    </td>

                    {/* Domain */}
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="text-[#787774] text-xs">{item.target_domain ?? '-'}</span>
                    </td>

                    {/* Score bars */}
                    <td className="px-5 py-3 hidden md:table-cell">
                      {item.overall_score !== null ? (
                        <div className="space-y-1.5 min-w-[120px]">
                          <div className="flex items-center gap-2 text-[10px] text-[#787774]">
                            <span className="w-14">{t('scoreHero.ats')}</span>
                            <MiniBar value={item.ats_score ?? 0} />
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[#787774]">
                            <span className="w-14">{t('scoreHero.keywords')}</span>
                            <MiniBar value={item.keyword_score ?? 0} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#787774]">-</span>
                      )}
                    </td>

                    {/* Overall score */}
                    <td className="px-5 py-3">
                      {item.overall_score !== null ? (
                        <ScoreBadge score={item.overall_score} />
                      ) : item.status.startsWith('failed') ? (
                        <span className="text-xs text-[#9F2F2D]">{t('history.filterFailed')}</span>
                      ) : (
                        <span className="text-xs text-[#787774]">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 ${meta.badgeClass}`}>
                        {meta.icon} {meta.label}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="text-xs text-[#787774]">
                        {new Date(item.uploaded_at).toLocaleDateString(
                          i18n.language?.startsWith('tr') ? 'tr-TR' : 'en-GB',
                          { day: '2-digit', month: 'short', year: 'numeric' }
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2 justify-end">
                        {isConfirming ? (
                          <>
                            <button
                              onClick={() => handleDelete(item.cv_id)}
                              disabled={isDeleting}
                              className="px-3 py-1.5 rounded-[var(--radius-sm)] bg-[#9F2F2D]/10 text-[#9F2F2D] border border-[#9F2F2D]/20 text-xs font-bold hover:bg-[#9F2F2D]/20 transition-colors disabled:opacity-50"
                            >
                              {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : t('common.confirm')}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-3 py-1.5 rounded-[var(--radius-sm)] bg-[#F7F6F3] dark:bg-white/[0.05] text-[#787774] dark:text-[#908d89] border border-[#EAEAEA] dark:border-white/[0.07] text-xs font-medium hover:bg-[#EAEAEA] dark:hover:bg-white/[0.08] transition-colors"
                            >
                              {t('common.cancel')}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setConfirmDelete(item.cv_id)}
                              className="w-8 h-8 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-[#A09D9A] hover:text-[#9F2F2D] hover:bg-[#9F2F2D]/10 transition-all"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {canView && (
                              <button
                                onClick={() => navigate(`/analysis/${item.cv_id}`)}
                                className="flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-sm)] bg-[#EEF2F8] dark:bg-[#1B3A6B]/20 border border-[#1B3A6B]/20 text-[#1B3A6B] dark:text-[#4a7dd1] text-xs font-semibold hover:bg-[#D6E4F7] dark:hover:bg-[#1B3A6B]/30 transition-all"
                              >
                                {t('history.viewReport')} <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
