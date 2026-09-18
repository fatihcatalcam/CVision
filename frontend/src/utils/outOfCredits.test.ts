import { describe, it, expect, vi, beforeEach } from 'vitest';

const toastError = vi.fn();
vi.mock('react-hot-toast', () => ({ default: { error: (...a: unknown[]) => toastError(...a) } }));
vi.mock('../i18n', () => ({
  default: { t: (key: string, opts?: Record<string, unknown>) => `${key}:${opts?.count}` },
}));

import { isOutOfCredits, notifyOutOfCredits, onOutOfCredits } from './outOfCredits';

beforeEach(() => {
  toastError.mockReset();
});

describe('isOutOfCredits', () => {
  it('is keyed on the status, not the English sentence', () => {
    // The backend sends "Not enough credits: this costs 2, you have 1." That
    // text is for logs and can change; 402 is the contract.
    expect(isOutOfCredits({ response: { status: 402, data: { detail: 'anything' } } })).toBe(true);
    expect(isOutOfCredits({ response: { status: 403 } })).toBe(false);
    expect(isOutOfCredits({ response: { data: { detail: 'Not enough credits' } } })).toBe(false);
    expect(isOutOfCredits(new Error('network'))).toBe(false);
    expect(isOutOfCredits(null)).toBe(false);
    expect(isOutOfCredits(undefined)).toBe(false);
  });
});

describe('notifyOutOfCredits', () => {
  it('hands the cost to the mounted dialog', () => {
    const shown = vi.fn();
    const stop = onOutOfCredits(shown);

    notifyOutOfCredits(2);

    expect(shown).toHaveBeenCalledWith(2);
    expect(toastError).not.toHaveBeenCalled();
    stop();
  });

  it('still says something when no dialog is mounted', async () => {
    // Silence here is the exact bug this whole change exists to remove, so the
    // fallback matters even though it should never run. It loads i18n lazily,
    // hence the await.
    notifyOutOfCredits(3);

    await vi.waitFor(() => expect(toastError).toHaveBeenCalledWith('credits.notEnough:3'));
  });

  it('stops listening once the dialog unmounts', async () => {
    const shown = vi.fn();
    onOutOfCredits(shown)();

    notifyOutOfCredits(1);

    expect(shown).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
