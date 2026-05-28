import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, RotateCcw, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QuotaCardProps {
  remaining: number;
  quota: number;
  isPremium: boolean;
  countdown: string | null;
  resetDate: string | null;
}

export function QuotaCard({
  remaining,
  quota,
  isPremium,
  countdown,
  resetDate,
}: QuotaCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const usedPct = Math.min((remaining / quota) * 100, 100);

  return (
    <div className="surface p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-[#FBF3DB] dark:bg-[#956400]/20">
          {isPremium
            ? <Sparkles className="w-3.5 h-3.5 text-[#956400]" />
            : <Lock className="w-3.5 h-3.5 text-[#956400]" />}
        </div>
        <span className="text-xs font-semibold text-[#787774] dark:text-[#908d89] uppercase tracking-wider">
          {isPremium ? t('quota.proLabel') : t('quota.freeLabel')}
        </span>
      </div>

      <div>
        <span className="text-2xl font-black text-[#111111] dark:text-[#e8e7e4]">
          {remaining}
        </span>
        <span className="text-sm text-[#787774] dark:text-[#908d89]"> {t('quota.remaining', { quota })}</span>
      </div>

      <div className="w-full bg-[#EAEAEA] dark:bg-white/[0.07] rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${isPremium ? 'bg-amber-500' : 'bg-[#1B3A6B]'}`}
          style={{ width: `${usedPct}%` }}
        />
      </div>

      {countdown && (
        <div className="flex items-center gap-1.5 text-[10px] text-[#787774] dark:text-[#6a6764]">
          <RotateCcw className="w-3 h-3 flex-shrink-0" />
          <span>
            {t('quota.resetsIn')}{' '}
            <span className="font-semibold text-[#111111] dark:text-[#e8e7e4]">{countdown}</span>
            {resetDate && (
              <span className="text-[#A09D9A] dark:text-[#6a6764]"> · {resetDate}</span>
            )}
          </span>
        </div>
      )}

      {!isPremium && (
        <button
          onClick={() => navigate('/pricing')}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] text-xs font-bold hover:bg-[#2a2a2a] dark:hover:bg-[#d0cfcc] active:scale-[0.98] transition-all"
        >
          <Sparkles className="w-3 h-3" /> {t('quota.upgradePro')} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
