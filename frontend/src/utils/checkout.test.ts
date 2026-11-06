import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const post = vi.fn();
vi.mock('../services/api', () => ({ default: { post: (...a: unknown[]) => post(...a) } }));

import { startCheckout, reportPurchase } from './checkout';

/**
 * GA4 sees the start of a checkout and the purchase. Lemon sends the buyer back
 * to /payment/success with nothing in the URL, so the pack is remembered when
 * the checkout opens and reported once on the way back.
 */

const PACK = { variant_id: 'small', credits: 3, price: 2999, currency: 'TRY' };
const gtag = vi.fn();
const assign = vi.fn();

beforeEach(() => {
  post.mockReset();
  gtag.mockReset();
  assign.mockReset();
  sessionStorage.clear();
  window.gtag = gtag;
  vi.stubGlobal('location', { ...window.location, set href(url: string) { assign(url); } });
});

afterEach(() => {
  delete window.gtag;
  vi.unstubAllGlobals();
});

describe('startCheckout', () => {
  it('opens Lemon checkout for the pack and counts it, without personal data', async () => {
    post.mockResolvedValue({ data: { checkoutUrl: 'https://lemon/checkout' } });

    await startCheckout(PACK, 'pricing');

    expect(post).toHaveBeenCalledWith('/payment/lemon/create-checkout', { variant_id: 'small' });
    expect(assign).toHaveBeenCalledWith('https://lemon/checkout');
    const [, name, params] = gtag.mock.calls[0];
    expect(name).toBe('begin_checkout');
    expect(params).toMatchObject({
      currency: 'TRY',
      value: 29.99,
      source: 'pricing',
      items: [{ item_id: 'small', item_name: '3 credits', price: 29.99, quantity: 1 }],
    });
    expect(JSON.stringify(params)).not.toMatch(/@|user/i);
  });

  it('counts nothing and leaves nowhere when the checkout cannot be created', async () => {
    post.mockRejectedValue(new Error('502'));

    await expect(startCheckout(PACK, 'out_of_credits')).rejects.toThrow();

    expect(gtag).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
    expect(sessionStorage.length).toBe(0);
  });
});

describe('reportPurchase', () => {
  it('reports the pack bought, once', async () => {
    post.mockResolvedValue({ data: { checkoutUrl: 'https://lemon/checkout' } });
    await startCheckout(PACK, 'out_of_credits');
    gtag.mockReset();

    reportPurchase();
    reportPurchase(); // a reload of the success page

    expect(gtag).toHaveBeenCalledTimes(1);
    const [, name, params] = gtag.mock.calls[0];
    expect(name).toBe('purchase');
    expect(params).toMatchObject({ currency: 'TRY', value: 29.99, source: 'out_of_credits' });
    expect(params.transaction_id).toEqual(expect.any(String));
  });

  it('reports nothing for a visit that did not come from a checkout', () => {
    reportPurchase();
    expect(gtag).not.toHaveBeenCalled();
  });
});
