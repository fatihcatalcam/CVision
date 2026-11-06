/**
 * GA4 events for the paywall funnel.
 *
 * GA4 already counts page views. What it could not see is the part between a
 * report and a sale: 412 users and no purchase, and no way to tell "nobody hits
 * the limit" from "people hit it and leave". Four events answer that:
 *
 *   out_of_credits_shown  the balance refused an action (which one, what it cost)
 *   begin_checkout        a pack was chosen and Lemon's checkout is opening
 *   purchase              back on /payment/success after paying
 *   (page_view /pricing)  already collected by GA4
 *
 * begin_checkout and purchase are GA4's recommended names and shapes, so they
 * land in the built-in monetisation reports. No personal data goes in: no
 * email, no name, no user id.
 */

declare global {
  interface Window {
    gtag?: (command: 'event', name: string, params?: Record<string, unknown>) => void;
  }
}

export type PaidAction = 'analysis' | 'match' | 'cover_letter' | 'unlock';

/** Send one event. A missing or blocked gtag (ad blockers, tests) is a no-op. */
export function track(name: string, params: Record<string, unknown> = {}): void {
  try {
    window.gtag?.('event', name, params);
  } catch {
    // Analytics must never break the thing it is measuring.
  }
}

/** The pack shape GA4's ecommerce events expect. Price arrives in minor units. */
export function packItem(pack: { variant_id: string; credits: number; price: number | null }) {
  return {
    item_id: pack.variant_id,
    item_name: `${pack.credits} credits`,
    item_category: 'credit_pack',
    quantity: 1,
    ...(pack.price != null && { price: pack.price / 100 }),
  };
}
