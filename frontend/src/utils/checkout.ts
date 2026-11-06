import api from '../services/api';
import type { CreditPack } from '../hooks/useCreditPacks';
import { track, packItem } from './track';

/**
 * Opening Lemon Squeezy's checkout for one pack, from wherever Buy was pressed.
 *
 * The pricing page and the out-of-credits dialog both sell packs; one function
 * keeps them from drifting on the parts that matter - the endpoint, the
 * begin_checkout event, and the note that lets /payment/success report the
 * purchase.
 */

const PENDING_KEY = 'cvision_pending_purchase';

type Pending = Pick<CreditPack, 'variant_id' | 'credits' | 'price' | 'currency'> & {
  id: string;
  source: string;
};

/** Where Buy was pressed, so the two places that sell can be compared. */
export type CheckoutSource = 'pricing' | 'out_of_credits';

/**
 * Create the checkout and leave for it. Resolves only if it fails - on success
 * the page is already navigating away.
 */
export async function startCheckout(pack: CreditPack, source: CheckoutSource): Promise<void> {
  const res = await api.post('/payment/lemon/create-checkout', { variant_id: pack.variant_id });

  track('begin_checkout', {
    currency: pack.currency ?? undefined,
    value: pack.price != null ? pack.price / 100 : undefined,
    items: [packItem(pack)],
    source,
  });

  // Lemon sends the buyer back to /payment/success in this same tab, with no
  // order details in the URL. What they bought is remembered here instead.
  try {
    const pending: Pending = {
      variant_id: pack.variant_id,
      credits: pack.credits,
      price: pack.price,
      currency: pack.currency,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source,
    };
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    // Private mode or blocked storage: the sale still happens, it just goes
    // unreported in GA4.
  }

  window.location.href = res.data.checkoutUrl;
}

/**
 * On /payment/success: report the purchase once, then forget it, so a reload
 * or a second visit cannot count the same sale twice.
 */
export function reportPurchase(): void {
  let pending: Pending | null = null;
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    pending = raw ? (JSON.parse(raw) as Pending) : null;
  } catch {
    return;
  }
  if (!pending) return;

  track('purchase', {
    transaction_id: pending.id,
    currency: pending.currency ?? undefined,
    value: pending.price != null ? pending.price / 100 : undefined,
    items: [packItem(pending)],
    source: pending.source,
  });
}
