import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HistoryItem {
  cv_id: string;
  original_filename: string;
  target_domain: string | null;
  status: string;
  uploaded_at: string;
  overall_score: number | null;
}

interface RecentAnalysesListProps {
  items: HistoryItem[];
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-[#346538] dark:text-[#4ade80]';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

export function RecentAnalysesList({ items }: RecentAnalysesListProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith('tr') ? 'tr-TR' : 'en-GB';
  const navigate = useNavigate();

  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-[#111111] dark:text-[#e8e7e4] text-sm flex items-center gap-2">
          <History className="w-4 h-4 text-[#787774] dark:text-[#908d89]" />
          {t('recent.title')}
        </h2>
        <button
          onClick={() => navigate('/history')}
          className="flex items-center gap-1.5 text-xs text-[#787774] hover:text-[#1B3A6B] dark:hover:text-[#4a7dd1] transition-colors font-medium"
        >
          {t('recent.viewAll')} <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.cv_id}
            onClick={() => item.status === 'completed' && navigate(`/analysis/${item.cv_id}`)}
            className={`surface p-4 flex items-center gap-4 transition-shadow ${
              item.status === 'completed'
                ? 'cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] group'
                : ''
            }`}
          >
            <div className="p-2 rounded-lg bg-[#F7F6F3] dark:bg-white/[0.05] text-[#787774] dark:text-[#908d89] flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#111111] dark:text-[#e8e7e4] truncate">
                {item.original_filename}
              </p>
              <p className="text-xs text-[#787774] dark:text-[#908d89] mt-0.5">
                {item.target_domain && <span className="mr-2">{item.target_domain}</span>}
                {new Date(item.uploaded_at).toLocaleDateString(dateLocale, {
                  day: '2-digit',
                  month: 'short',
                })}
              </p>
            </div>

            {item.overall_score !== null ? (
              <span className={`font-black text-base ${scoreColor(item.overall_score)}`}>
                {Math.round(item.overall_score)}%
              </span>
            ) : (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                item.status.startsWith('failed')
                  ? 'text-red-600 bg-red-50 dark:bg-red-500/10'
                  : 'text-[#787774] dark:text-[#908d89] bg-[#F7F6F3] dark:bg-white/[0.05]'
              }`}>
                {item.status}
              </span>
            )}

            {item.status === 'completed' && (
              <ChevronRight className="w-4 h-4 text-[#A09D9A] group-hover:text-[#1B3A6B] dark:group-hover:text-[#4a7dd1] transition-colors flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
