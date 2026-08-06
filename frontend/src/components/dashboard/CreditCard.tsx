import { useNavigate } from 'react-router-dom';
import { Coins, Gift, ChevronRight, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCreditPacks } from '../../hooks/useCreditPacks';

interface CreditCardProps {
  credits: number;
  /** Credits added each week while the balance is under the cap. */
  weekly: number;
  /** Balance at or above which the weekly grant pauses. */
  cap: number;
}

/**
 * Replaces QuotaCard. The old card showed "2 of 3 analyses left this week",
 * which was the whole story under a weekly quota; a balance is spent at
 * different rates by different actions, so the number alone means nothing
 * without saying what it buys. Hence the price line rather than a progress bar -
 * there is no longer a denominator to fill.
 */
export function CreditCard({ credits, weekly, cap }: CreditCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { onSale } = useCreditPacks();

  const low = credits < 3;

  return (
    <div className="surface p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-[#FBF3DB] dark:bg-[#956400]/20">
          <Coins className="w-3.5 h-3.5 text-[#956400]" />
        </div>
        <span className="text-xs font-semibold text-[#6B6A65] dark:text-[#908d89] uppercase tracking-wider">
          {t('credits.label')}
        </span>
      </div>

      <div>
        <span className="text-2xl font-black text-[#111111] dark:text-[#e8e7e4]">
          {credits}
        </span>
        <span className="text-sm text-[#6B6A65] dark:text-[#908d89]"> {t('credits.unit')}</span>
      </div>

      <p className="text-[11px] leading-relaxed text-[#6B6A65] dark:text-[#908d89]">
        {credits >= cap ? t('credits.weeklyPaused', { cap }) : t('credits.weekly', { weekly })}
      </p>

      {low && (
        <p className="text-[11px] leading-relaxed text-[#956400] dark:text-[#c4890a]">
          {t('credits.low')}
        </p>
      )}

      <button
        onClick={() => navigate('/settings#referral')}
        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-white dark:bg-[#1c1c1a] text-[#111111] dark:text-[#e8e7e4] border border-[#8A8985] dark:border-white/[0.36] text-xs font-bold hover:bg-[#F7F6F3] dark:hover:bg-[#272725] active:scale-[0.98] transition-all"
      >
        <Gift className="w-3 h-3" /> {t('credits.inviteCta')} <ChevronRight className="w-3 h-3" />
      </button>

      {/* Only rendered once packs are actually on sale - see useCreditPacks. */}
      {onSale && (
        <button
          onClick={() => navigate('/pricing')}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] text-xs font-bold hover:bg-[#2a2a2a] dark:hover:bg-[#f2f1ee] active:scale-[0.98] transition-all"
        >
          <ShoppingCart className="w-3 h-3" /> {t('credits.buyCta')}
        </button>
      )}
    </div>
  );
}
