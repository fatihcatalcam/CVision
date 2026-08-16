import { useNavigate } from 'react-router-dom';
import { Coins, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCreditPacks } from '../../hooks/useCreditPacks';

interface MobileCreditBarProps {
  credits: number;
}

/**
 * The balance, above the fold, on phones.
 *
 * CreditCard lives in the dashboard's right-hand column. That column is beside
 * the main card on desktop, but the grid collapses to one column below `lg`,
 * so on a phone the card stacks underneath - and behind CareerInsightCard and
 * NextStepCard as well, which puts the number roughly three cards down. People
 * had to go looking for the one figure that decides whether they can run
 * anything.
 *
 * A row rather than a card, and directly under the header, because the header
 * itself is already carrying four or five controls at that width and another
 * one would crowd them. `lg:hidden` keeps the desktop layout untouched, where
 * the sidebar card is visible without scrolling anyway.
 *
 * It asks useCreditPacks for the same reason CreditCard does: nothing may
 * advertise a checkout while no pack is on sale. The first version of this
 * skipped the call to save a request and pointed at /pricing unconditionally -
 * an existing dashboard test caught it immediately, which is exactly what that
 * test is for. A second GET of a tiny endpoint is the cheaper mistake.
 */
export function MobileCreditBar({ credits }: MobileCreditBarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { onSale } = useCreditPacks();

  // Same threshold CreditCard warns at, so the two never disagree on screen.
  const low = credits < 3;

  // Where more credits actually come from right now. With no pack on sale the
  // referral is the only real answer, and it is what CreditCard offers too.
  const destination = onSale ? '/pricing' : '/settings#referral';
  const action = onSale ? t('credits.buyCta') : t('credits.inviteCta');

  return (
    <button
      data-testid="mobile-credit-bar"
      onClick={() => navigate(destination)}
      className={`lg:hidden w-full mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all active:scale-[0.99] ${
        low
          ? 'bg-[#FBF3DB] dark:bg-[#956400]/15 border-[#956400]/30'
          : 'surface border-[#EAEAEA] dark:border-white/[0.07]'
      }`}
    >
      <div className="p-1.5 rounded-lg bg-[#FBF3DB] dark:bg-[#956400]/20 shrink-0">
        <Coins className="w-3.5 h-3.5 text-[#956400]" />
      </div>

      <span className="flex items-baseline gap-1.5 shrink-0">
        <span className="text-lg font-black text-[#111111] dark:text-[#e8e7e4]">
          {credits}
        </span>
        <span className="text-xs text-[#6B6A65] dark:text-[#908d89]">
          {t('credits.unit')}
        </span>
      </span>

      {/* The reason the number matters, not just the number. Truncated rather
          than wrapped: this row must stay one line at 320px. */}
      <span className="flex-1 min-w-0 text-left text-[11px] leading-tight text-[#6B6A65] dark:text-[#908d89] truncate">
        {low ? t('credits.low') : action}
      </span>

      <ChevronRight className="w-4 h-4 text-[#6B6A65] dark:text-[#908d89] shrink-0" />
    </button>
  );
}
