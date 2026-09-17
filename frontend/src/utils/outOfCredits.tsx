import toast from 'react-hot-toast';
import type { TFunction } from 'i18next';
import api from '../services/api';

/**
 * The moment someone runs out of credits is the only moment they are ready to
 * buy some, and it used to be a dead end.
 *
 * The backend refuses with 402 and an English sentence ("Not enough credits:
 * this costs 2, you have 1."). Every caller put that sentence straight into a
 * red toast - in English, on a Turkish page, with nothing to click - and the
 * two cover-letter buttons swallowed the error entirely, so the button just
 * stopped spinning. The backend's own docstring says the frontend "offers a
 * top-up"; nothing ever did.
 *
 * Status, not message: the text is for humans reading logs and may change,
 * while 402 is the contract.
 */
export function isOutOfCredits(err: unknown): boolean {
  return (err as { response?: { status?: number } } | null)?.response?.status === 402;
}

interface NotifyOptions {
  t: TFunction;
  navigate: (to: string) => void;
  /** What the refused action costs, from constants/credits. */
  cost: number;
}

/**
 * Tell the user what happened in their language, and give them the way out.
 *
 * The balance is deliberately not quoted. The caller's copy of it can be stale
 * - that is often exactly why the request was made - and "you have 3" next to
 * a refusal is worse than saying nothing. Callers refresh the user instead, so
 * the balances already on screen become true.
 *
 * Whether packs are on sale is asked here, at the moment it matters, rather
 * than by every page on mount: this runs rarely, and nothing may advertise a
 * checkout while there is nothing to buy (see useCreditPacks).
 */
export async function notifyOutOfCredits({ t, navigate, cost }: NotifyOptions): Promise<void> {
  let onSale = false;
  try {
    const { data } = await api.get('/payment/packs');
    onSale = Array.isArray(data?.packs) && data.packs.length > 0;
  } catch {
    // Unreachable pricing is treated like nothing on sale: offer the referral.
  }

  const destination = onSale ? '/pricing' : '/settings#referral';
  const action = onSale ? t('credits.buyCta') : t('credits.inviteCta');

  // No dark: variants on the button - the toast surface is white in both
  // themes (main.tsx), so a themed button would go pale-on-white at night.
  toast.error(
    (current) => (
      <span className="flex flex-col items-start gap-2" data-testid="out-of-credits">
        <span>{t('credits.notEnough', { count: cost })}</span>
        <button
          type="button"
          onClick={() => {
            toast.dismiss(current.id);
            navigate(destination);
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#111111] text-white hover:bg-[#2a2a2a] active:scale-[0.98] transition-all"
        >
          {action}
        </button>
      </span>
    ),
    // A fixed id: a double-click must not stack two identical toasts, and the
    // action needs longer on screen than a plain error does.
    { id: 'out-of-credits', duration: 8000 },
  );
}
