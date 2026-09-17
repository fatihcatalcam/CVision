import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import type { TFunction } from 'i18next';

/**
 * 300 analyses, no purchases. The one moment someone needs credits used to be
 * an English toast - "Not enough credits: this costs 2, you have 1." - with
 * nothing to click, and the cover-letter buttons showed nothing at all. These
 * pin what replaced it: the user's language, and a way forward that exists.
 */

const get = vi.fn();
vi.mock('../services/api', () => ({ default: { get: (...a: unknown[]) => get(...a) } }));

const toastError = vi.fn();
const toastDismiss = vi.fn();
vi.mock('react-hot-toast', () => ({
  default: {
    error: (...a: unknown[]) => toastError(...a),
    dismiss: (...a: unknown[]) => toastDismiss(...a),
  },
}));

import { isOutOfCredits, notifyOutOfCredits } from './outOfCredits';

const t = ((key: string, opts?: Record<string, unknown>) =>
  opts?.count !== undefined ? `${key}:${opts.count}` : key) as unknown as TFunction;

/** Render whatever notifyOutOfCredits handed to toast.error. */
function renderToast() {
  const [content, options] = toastError.mock.calls[0];
  const node = typeof content === 'function'
    ? (content as (toast: { id: string }) => ReactElement)({ id: 'toast-1' })
    : content;
  render(node);
  return options as { id: string; duration: number };
}

beforeEach(() => {
  get.mockReset();
  toastError.mockReset();
  toastDismiss.mockReset();
});

describe('isOutOfCredits', () => {
  it('is keyed on the status, not the English sentence', () => {
    expect(isOutOfCredits({ response: { status: 402, data: { detail: 'anything' } } })).toBe(true);
    expect(isOutOfCredits({ response: { status: 403 } })).toBe(false);
    expect(isOutOfCredits({ response: { data: { detail: 'Not enough credits' } } })).toBe(false);
    expect(isOutOfCredits(new Error('network'))).toBe(false);
    expect(isOutOfCredits(null)).toBe(false);
    expect(isOutOfCredits(undefined)).toBe(false);
  });
});

describe('notifyOutOfCredits', () => {
  it('offers to buy credits when packs are on sale, and goes to pricing', async () => {
    get.mockResolvedValue({ data: { packs: [{ variant_id: '1', credits: 10 }] } });
    const navigate = vi.fn();

    await notifyOutOfCredits({ t, navigate, cost: 2 });
    const options = renderToast();

    expect(get).toHaveBeenCalledWith('/payment/packs');
    expect(screen.getByText('credits.notEnough:2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'credits.buyCta' }));
    expect(navigate).toHaveBeenCalledWith('/pricing');
    expect(toastDismiss).toHaveBeenCalledWith('toast-1');
    // One toast however many times the button is hammered.
    expect(options.id).toBe('out-of-credits');
  });

  it('offers the referral instead when nothing is on sale', async () => {
    // Nothing may advertise a checkout that would answer "not on sale yet".
    get.mockResolvedValue({ data: { packs: [] } });
    const navigate = vi.fn();

    await notifyOutOfCredits({ t, navigate, cost: 1 });
    renderToast();

    expect(screen.queryByText('credits.buyCta')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'credits.inviteCta' }));
    expect(navigate).toHaveBeenCalledWith('/settings#referral');
  });

  it('falls back to the referral when pricing cannot be reached', async () => {
    get.mockRejectedValue(new Error('offline'));
    const navigate = vi.fn();

    await notifyOutOfCredits({ t, navigate, cost: 3 });
    renderToast();

    expect(screen.getByText('credits.notEnough:3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'credits.inviteCta' })).toBeInTheDocument();
  });

  it('never repeats the backend English sentence', async () => {
    get.mockResolvedValue({ data: { packs: [] } });
    await notifyOutOfCredits({ t, navigate: vi.fn(), cost: 2 });
    renderToast();

    expect(screen.queryByText(/Not enough credits/)).not.toBeInTheDocument();
  });
});
