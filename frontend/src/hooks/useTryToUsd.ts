import { useEffect, useState } from 'react';

const TRY_PRICE = 199.99;

export function useTryToUsd(): { isTurkey: boolean; usdPrice: string | null } {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isTurkey = tz === 'Europe/Istanbul';

  const [usdPrice, setUsdPrice] = useState<string | null>(null);

  useEffect(() => {
    if (isTurkey) return;
    fetch('https://api.frankfurter.app/latest?from=TRY&to=USD')
      .then((r) => r.json())
      .then((data) => {
        const rate: number = data?.rates?.USD;
        if (rate) setUsdPrice((TRY_PRICE * rate).toFixed(2));
      })
      .catch(() => setUsdPrice('4.50'));
  }, [isTurkey]);

  return { isTurkey, usdPrice };
}
