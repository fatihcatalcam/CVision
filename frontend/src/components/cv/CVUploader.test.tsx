import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CVUploader } from './CVUploader';

/**
 * The Normal/Pro choice has to be on the FIRST screen.
 *
 * Reported after it shipped: clicking "New analysis" showed no choice at all.
 * The buttons existed but sat in the branch that only renders once a file is
 * selected, so the opening screen looked identical to the version with no
 * choice - and nobody clicks through hoping an option appears later.
 *
 * These render the component with no file chosen, which is exactly the state
 * that was broken.
 */

vi.mock('../../services/api', () => ({
  default: { post: vi.fn() },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Echo the key so assertions do not depend on any one language's wording.
    t: (key: string, opts?: Record<string, unknown>) =>
      opts?.cost !== undefined ? `${key}:${opts.cost}` : key,
    i18n: { language: 'en' },
  }),
}));

describe('CVUploader tier choice', () => {
  it('offers Normal and Pro before a file is picked', () => {
    render(<CVUploader onUploadSuccess={() => {}} />);

    expect(screen.getByText('uploader.tier.normalTitle')).toBeInTheDocument();
    expect(screen.getByText('uploader.tier.proTitle')).toBeInTheDocument();
  });

  it('prices them 1 and 3, so the cost is known before committing a file', () => {
    render(<CVUploader onUploadSuccess={() => {}} />);

    expect(screen.getByText('uploader.tier.cost:1')).toBeInTheDocument();
    expect(screen.getByText('uploader.tier.cost:3')).toBeInTheDocument();
  });

  it('starts on Pro, and both prices are on screen before anything is spent', () => {
    // Deliberate change of default. Normal was preselected and almost nobody
    // moved off it, then unlocked afterwards anyway - the same 3 credits in two
    // steps with a locked page in between. A default that charges more is only
    // defensible while the price is visible without looking for it, so this
    // asserts the two together: the selection AND the cost beside it.
    render(<CVUploader onUploadSuccess={() => {}} />);

    const normal = screen.getByText('uploader.tier.normalTitle').closest('button');
    const pro = screen.getByText('uploader.tier.proTitle').closest('button');

    expect(pro).toHaveAttribute('aria-pressed', 'true');
    expect(normal).toHaveAttribute('aria-pressed', 'false');

    expect(screen.getByText('uploader.tier.cost:1')).toBeInTheDocument();
    expect(screen.getByText('uploader.tier.cost:3')).toBeInTheDocument();
  });

  it('lets one click take you back to Normal', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    render(<CVUploader onUploadSuccess={() => {}} />);

    await userEvent.click(screen.getByText('uploader.tier.normalTitle'));

    expect(screen.getByText('uploader.tier.normalTitle').closest('button'))
      .toHaveAttribute('aria-pressed', 'true');
  });

  it('sends the visitor to signup when the free try is used up', async () => {
    // A 429 used to raise a toast and leave them on a page whose only button
    // would keep failing. The caller decides where they go; /try sends them to
    // the signup that removes the limit.
    const { default: userEvent } = await import('@testing-library/user-event');
    const api = (await import('../../services/api')).default as any;
    api.post.mockRejectedValueOnce({ response: { status: 429 } });
    const onLimitReached = vi.fn();

    render(
      <CVUploader anonymous onUploadSuccess={() => {}} onLimitReached={onLimitReached} />,
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(
      input,
      new File(['x'], 'cv.pdf', { type: 'application/pdf' }),
    );
    await userEvent.click(screen.getByText('uploader.analyzeButton'));

    await waitFor(() => expect(onLimitReached).toHaveBeenCalled());
  });

  it('hides the choice on the anonymous /try flow, which has no balance', () => {
    render(<CVUploader anonymous onUploadSuccess={() => {}} />);

    expect(screen.queryByText('uploader.tier.normalTitle')).not.toBeInTheDocument();
    expect(screen.queryByText('uploader.tier.proTitle')).not.toBeInTheDocument();
  });
});
