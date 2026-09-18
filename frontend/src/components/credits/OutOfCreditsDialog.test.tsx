import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * 300 analyses, zero purchases. The one moment someone needs credits answered
 * 402 with an English sentence and nothing to click; the first fix put it in a
 * corner toast, which was still the wrong shape. Running out of credits is not
 * a notification - it is the end of what the user was doing - so it stops the
 * screen and asks for a decision.
 */

const get = vi.fn();
vi.mock('../../services/api', () => ({ default: { get: (...a: unknown[]) => get(...a) } }));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts?.count !== undefined ? `${key}:${opts.count}` : key,
    i18n: { language: 'tr' },
  }),
}));

import { OutOfCreditsDialog } from './OutOfCreditsDialog';
import { notifyOutOfCredits } from '../../utils/outOfCredits';

const renderDialog = () =>
  render(
    <MemoryRouter>
      <OutOfCreditsDialog />
    </MemoryRouter>,
  );

/** Raise it the way a failed request does, from outside React. */
async function refuse(cost: number) {
  await act(async () => {
    notifyOutOfCredits(cost);
  });
  return screen.findByRole('dialog', { name: 'credits.notEnoughTitle' });
}

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({ data: { packs: [] } });
  navigate.mockReset();
});

describe('OutOfCreditsDialog', () => {
  it('stays out of the way until something is actually refused', () => {
    renderDialog();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stops the screen and names the price of what was refused', async () => {
    renderDialog();
    await refuse(2);

    expect(screen.getByText('credits.notEnough:2')).toBeInTheDocument();
    // A dialog, not a toast: it is announced, and it takes the keyboard.
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('sits above whatever dialog was already open', async () => {
    // The refusal usually arrives from inside the upload dialog.
    renderDialog();
    const dialog = await refuse(1);

    expect(dialog.className).toContain('z-[100]');
    expect(dialog.className).toContain('items-center');
  });

  it('offers to buy credits when packs are on sale, and goes to pricing', async () => {
    get.mockResolvedValue({ data: { packs: [{ variant_id: '1', credits: 10 }] } });
    renderDialog();
    await refuse(2);

    await waitFor(() => expect(get).toHaveBeenCalledWith('/payment/packs'));
    await userEvent.click(await screen.findByRole('button', { name: 'credits.buyCta' }));

    expect(navigate).toHaveBeenCalledWith('/pricing');
  });

  it('offers the referral instead when nothing is on sale', async () => {
    // Nothing may advertise a checkout that would answer "not on sale yet".
    renderDialog();
    await refuse(2);

    expect(screen.queryByText('credits.buyCta')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'credits.inviteCta' }));

    expect(navigate).toHaveBeenCalledWith('/settings#referral');
  });

  it('falls back to the referral when pricing cannot be reached', async () => {
    get.mockRejectedValue(new Error('offline'));
    renderDialog();
    await refuse(3);

    expect(await screen.findByRole('button', { name: 'credits.inviteCta' })).toBeInTheDocument();
  });

  it('can be dismissed without going anywhere', async () => {
    // Someone short of a Pro upload can still afford a Normal one, and that
    // choice is in the dialog underneath this one.
    renderDialog();
    await refuse(3);

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
