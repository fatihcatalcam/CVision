import { useEffect, useState } from 'react';
import api from '../services/api';

export interface CreditPack {
  variant_id: string;
  credits: number;
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
