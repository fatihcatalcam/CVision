import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Coins, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { ModalShell } from '../ui/ModalShell';
import { onOutOfCredits, type OutOfCredits } from '../../utils/outOfCredits';
import { formatPrice, type CreditPack } from '../../hooks/useCreditPacks';
import { startCheckout } from '../../utils/checkout';

/**
 * What the product says when the balance is too low. Mounted once, in App.
 *
 * A toast in the corner was the first version of this fix, and it was the
 * wrong shape: running out of credits is not a notification, it is the end of
 * what the user was trying to do. It needs the middle of the screen and a
 * decision, not four seconds in the periphery.
 *
 * It is also the only moment anyone is asked to pay, and with 412 users and no
 * sale it said "not enough credits" and sent them to the pricing page - where
 * GA4 shows visitors staying 11 seconds. So it now makes the offer itself:
 * what was refused, the smallest pack with its price, and one click to Lemon's
 * checkout. The other packs and the free way (inviting a friend) stay one
 * click away, and closing it costs nothing.
 *
 * It can open on top of another dialog - the upload one, most often, since
 * that is where an upload gets refused - so it sits above them on z-index and
 * leaves that dialog open underneath, with the chosen file still in it.
 */
export function OutOfCreditsDialog() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [refusal, setRefusal] = useState<OutOfCredits | null>(null);
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [buying, setBuying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => onOutOfCredits(setRefusal), []);

  // Fetched when the dialog opens rather than with the app: it is mounted on
  // every page and almost never shown.
  useEffect(() => {
    if (refusal === null) return;
    let alive = true;
    api
      .get('/payment/packs')
      .then(({ data }) => { if (alive) setPacks(Array.isArray(data?.packs) ? data.packs : []); })
      .catch(() => { if (alive) setPacks([]); });
    return () => { alive = false; };
  }, [refusal]);

  const close = () => { setRefusal(null); setBuying(false); setFailed(false); };
  const go = (to: string) => { close(); navigate(to); };

  // Packs arrive smallest first. The smallest is the offer: the cheapest way
  // past this one refusal, not the best value per credit.
  const offer = packs[0];
  const price = offer ? formatPrice(offer, i18n.language) : null;

  const buy = async () => {
    if (!offer) return;
    setBuying(true);
    setFailed(false);
    try {
      await startCheckout(offer, 'out_of_credits');
    } catch {
      setBuying(false);
      setFailed(true);
    }
  };

  return (
    <ModalShell
      isOpen={refusal !== null}
      onClose={close}
      label={refusal ? t(`credits.paywall.${refusal.action}`) : t('credits.notEnoughTitle')}
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
        {refusal && t(`credits.paywall.${refusal.action}`)}
      </h2>
      {/* The balance is deliberately not quoted: the caller's copy can be stale,
          which is often why the request was made at all. Callers refresh the
          user instead, so the numbers already on screen become true. */}
      <p className="text-sm leading-relaxed mb-6 text-[var(--color-muted)]">
        {t('credits.notEnough', { count: refusal?.cost ?? 0 })}
      </p>

      {offer ? (
        <>
          <button
            type="button"
            onClick={buy}
            disabled={buying}
            className="w-full h-11 rounded-xl text-sm font-bold bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {buying && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {price
              ? t('credits.paywall.buyPack', { credits: offer.credits, price })
              : t('credits.paywall.buyPackNoPrice', { credits: offer.credits })}
          </button>
          {failed && (
            <p role="alert" className="mt-2 text-xs text-[var(--color-danger,#9F2F2D)]">
              {t('credits.paywall.error')}
            </p>
          )}
          <div className="mt-3 flex items-center justify-center gap-4 text-xs">
            {packs.length > 1 && (
              <button
                type="button"
                onClick={() => go('/pricing')}
                className="underline underline-offset-2 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                {t('credits.paywall.otherPacks')}
              </button>
            )}
            <button
              type="button"
              onClick={() => go('/settings#referral')}
              className="underline underline-offset-2 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              {t('credits.inviteCta')}
            </button>
          </div>
        </>
      ) : (
        // Nothing on sale, or the packs could not be read: the free way is the
        // only honest offer. Nothing may advertise a checkout that would answer
        // "not on sale yet".
        <button
          type="button"
          onClick={() => go('/settings#referral')}
          className="w-full h-11 rounded-xl text-sm font-bold bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-90 active:scale-[0.98] transition-all"
        >
          {t('credits.inviteCta')}
        </button>
      )}

      <button
        type="button"
        onClick={close}
        className="mt-3 w-full h-11 rounded-xl text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-accent)] transition-colors"
      >
        {t('common.close')}
      </button>
    </ModalShell>
  );
}
