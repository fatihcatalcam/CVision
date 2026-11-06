import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * 412 users, zero purchases. The one moment someone needs credits used to say
 * "not enough credits" and send them to the pricing page, where GA4 shows
 * visitors staying 11 seconds. Now the dialog is the offer: what was refused,
 * the smallest pack with its price, one click to checkout - and the free way
 * and "not now" one click away.
 */

const get = vi.fn();
const post = vi.fn();
vi.mock('../../services/api', () => ({
  default: {
    get: (...a: unknown[]) => get(...a),
    post: (...a: unknown[]) => post(...a),
  },
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
    i18n: { language: 'tr' },
  }),
}));

import { OutOfCreditsDialog } from './OutOfCreditsDialog';
import { notifyOutOfCredits } from '../../utils/outOfCredits';
import type { PaidAction } from '../../utils/track';

const PACKS = [
  { variant_id: 'small', credits: 3, price: 2999, currency: 'TRY' },
  { variant_id: 'mid', credits: 10, price: 7999, currency: 'TRY' },
];

const renderDialog = () =>
  render(
    <MemoryRouter>
      <OutOfCreditsDialog />
    </MemoryRouter>,
  );

/** Raise it the way a failed request does, from outside React. */
async function refuse(cost: number, action: PaidAction = 'match') {
  await act(async () => {
    notifyOutOfCredits(cost, action);
  });
  return screen.findByRole('dialog', { name: `credits.paywall.${action}` });
}

const gtag = vi.fn();
const assign = vi.fn();

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  get.mockResolvedValue({ data: { packs: [] } });
  navigate.mockReset();
  gtag.mockReset();
  window.gtag = gtag;
  sessionStorage.clear();
  assign.mockReset();
  vi.stubGlobal('location', { ...window.location, set href(url: string) { assign(url); } });
});

afterEach(() => {
  delete window.gtag;
  vi.unstubAllGlobals();
});

describe('OutOfCreditsDialog', () => {
  it('stays out of the way until something is actually refused', () => {
    renderDialog();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('names what was refused and what it costs', async () => {
    renderDialog();
    await refuse(2, 'cover_letter');

    expect(screen.getByRole('heading', { name: 'credits.paywall.cover_letter' })).toBeInTheDocument();
    expect(screen.getByText('credits.notEnough:{"count":2}')).toBeInTheDocument();
    // A dialog, not a toast: it is announced, and it takes the keyboard.
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('sits above whatever dialog was already open', async () => {
    // The refusal usually arrives from inside the upload dialog.
    renderDialog();
    const dialog = await refuse(3, 'analysis');

    expect(dialog.className).toContain('z-[100]');
    expect(dialog.className).toContain('items-center');
  });

  it('offers the smallest pack with its price, and goes straight to checkout', async () => {
    get.mockResolvedValue({ data: { packs: PACKS } });
    post.mockResolvedValue({ data: { checkoutUrl: 'https://cvision.lemonsqueezy.com/checkout/x' } });
    renderDialog();
    await refuse(2);

    const buy = await screen.findByRole('button', { name: /credits\.paywall\.buyPack:.*"credits":3/ });
    expect(buy.textContent).toMatch(/29[.,]99/);
    await userEvent.click(buy);

    expect(post).toHaveBeenCalledWith('/payment/lemon/create-checkout', { variant_id: 'small' });
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://cvision.lemonsqueezy.com/checkout/x'));
    expect(navigate).not.toHaveBeenCalled();
    // Counted as a checkout started from here, not from the pricing page.
    expect(gtag).toHaveBeenCalledWith(
      'event',
      'begin_checkout',
      expect.objectContaining({ currency: 'TRY', value: 29.99, source: 'out_of_credits' }),
    );
  });

  it('keeps the other packs one click away', async () => {
    get.mockResolvedValue({ data: { packs: PACKS } });
    renderDialog();
    await refuse(2);

    await userEvent.click(await screen.findByRole('button', { name: 'credits.paywall.otherPacks' }));
    expect(navigate).toHaveBeenCalledWith('/pricing');
  });

  it('says so, and stays open, when the checkout cannot be opened', async () => {
    get.mockResolvedValue({ data: { packs: PACKS } });
    post.mockRejectedValue(new Error('502'));
    renderDialog();
    await refuse(2);

    await userEvent.click(await screen.findByRole('button', { name: /credits\.paywall\.buyPack/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('credits.paywall.error');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('offers the referral instead when nothing is on sale', async () => {
    // Nothing may advertise a checkout that would answer "not on sale yet".
    renderDialog();
    await refuse(2);

    expect(screen.queryByRole('button', { name: /credits\.paywall\.buyPack/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'credits.inviteCta' }));

    expect(navigate).toHaveBeenCalledWith('/settings#referral');
  });

  it('falls back to the referral when the packs cannot be read', async () => {
    get.mockRejectedValue(new Error('offline'));
    renderDialog();
    await refuse(3, 'analysis');

    expect(await screen.findByRole('button', { name: 'credits.inviteCta' })).toBeInTheDocument();
  });

  it('can be dismissed without going anywhere', async () => {
    renderDialog();
    await refuse(3, 'analysis');

    await userEvent.click(screen.getByRole('button', { name: 'common.close' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(navigate).not.toHaveBeenCalled();
  });

  it('never repeats the English sentence the backend sends', async () => {
    renderDialog();
    await refuse(2);

    expect(screen.queryByText(/Not enough credits/)).not.toBeInTheDocument();
  });
});
