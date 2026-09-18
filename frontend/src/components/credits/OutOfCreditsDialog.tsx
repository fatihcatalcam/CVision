import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Coins } from 'lucide-react';
import api from '../../services/api';
import { ModalShell } from '../ui/ModalShell';
import { onOutOfCredits } from '../../utils/outOfCredits';

/**
 * What the product says when the balance is too low. Mounted once, in App.
 *
 * A toast in the corner was the first version of this fix, and it was the
 * wrong shape: running out of credits is not a notification, it is the end of
 * what the user was trying to do. It needs the middle of the screen and a
 * decision, not four seconds in the periphery.
 *
 * It can open on top of another dialog - the upload one, most often, since
 * that is where an upload gets refused - so it sits above them on z-index and
 * leaves that dialog open underneath. The tier switch in the upload dialog is
 * still the right answer for someone who can afford a Normal analysis but not
 * a Pro one.
 */
export function OutOfCreditsDialog() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cost, setCost] = useState<number | null>(null);
  const [onSale, setOnSale] = useState(false);

  useEffect(() => onOutOfCredits(setCost), []);

  useEffect(() => {
    if (cost === null) return;
    let alive = true;
    // Asked when it matters rather than by every page on mount: this is rare,
    // and nothing may advertise a checkout while there is nothing to buy.
    api
      .get('/payment/packs')
      .then(({ data }) => { if (alive) setOnSale(Array.isArray(data?.packs) && data.packs.length > 0); })
      // An unreachable pricing endpoint is treated like nothing on sale.
      .catch(() => { if (alive) setOnSale(false); })
      ;
    return () => { alive = false; };
  }, [cost]);

  const destination = onSale ? '/pricing' : '/settings#referral';
  const action = onSale ? t('credits.buyCta') : t('credits.inviteCta');

  return (
    <ModalShell
      isOpen={cost !== null}
      onClose={() => setCost(null)}
      label={t('credits.notEnoughTitle')}
      containerClassName="fixed inset-0 z-[100] flex items-center justify-center p-4"
      panelClassName="w-full max-w-sm surface rounded-2xl shadow-2xl p-6 text-center"
    >
      <div
        className="w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-[var(--color-warning-bg)] text-[var(--color-warning)]"
        data-testid="out-of-credits"
      >
        <Coins className="w-6 h-6" aria-hidden="true" />
      </div>

      <h2 className="text-lg font-bold tracking-tight mb-2 text-[var(--color-foreground)]">
        {t('credits.notEnoughTitle')}
      </h2>
      {/* The balance is deliberately not quoted: the caller's copy can be stale,
          which is often why the request was made at all. Callers refresh the
          user instead, so the numbers already on screen become true. */}
      <p className="text-sm leading-relaxed mb-6 text-[var(--color-muted)]">
        {t('credits.notEnough', { count: cost ?? 0 })}
      </p>

      <button
        type="button"
        onClick={() => { setCost(null); navigate(destination); }}
        className="w-full h-11 rounded-xl text-sm font-bold bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-90 active:scale-[0.98] transition-all"
      >
        {action}
      </button>
      <button
        type="button"
        onClick={() => setCost(null)}
        className="mt-2 w-full h-11 rounded-xl text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-accent)] transition-colors"
      >
        {t('common.close')}
      </button>
    </ModalShell>
  );
}
