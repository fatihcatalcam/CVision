import { useEffect, useState } from 'react';
import api from '../services/api';

export interface CreditPack {
  variant_id: string;
  credits: number;
  /** Minor units (kuruş/cents). Null when Lemon Squeezy could not be read. */
  price: number | null;
  currency: string | null;
}

/**
 * Formats a Lemon Squeezy amount for display.
 *
 * Returns null rather than a placeholder when there is no price: a card with no
 * number is honest, "—" or "0" is not.
 */
export function formatPrice(
  pack: Pick<CreditPack, 'price' | 'currency'>,
  locale: string,
): string | null {
  if (pack.price == null || !pack.currency) return null;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: pack.currency,
      maximumFractionDigits: 2,
    }).format(pack.price / 100);
  } catch {
    // An unexpected currency code must not blank the whole page.
    return `${(pack.price / 100).toFixed(2)} ${pack.currency}`;
  }
}

/**
 * The credit packs currently on sale, smallest first.
 *
 * Packs only exist once CREDIT_PACKS is configured against real Lemon Squeezy
 * variants, so every "Buy credits" entry point has to ask first: sending
 * someone to a checkout that answers "not on sale yet" is worse than showing no
 * button at all.
 *
 * `null` means the answer has not arrived; `[]` means nothing is on sale.
 */
export function useCreditPacks() {
  const [packs, setPacks] = useState<CreditPack[] | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .get('/payment/packs')
      .then((res) => { if (alive) setPacks(res.data.packs); })
      // A failed request is indistinguishable from nothing being on sale as far
      // as the UI is concerned - either way there is nothing to buy right now.
      .catch(() => { if (alive) setPacks([]); });
    return () => { alive = false; };
  }, []);

  return { packs, onSale: !!packs && packs.length > 0 };
}
