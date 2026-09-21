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

describe('CVUploader price', () => {
  it('states the one price before a file is picked', () => {
    // There is no Normal/Pro choice any more: almost nobody moved off the
    // default, and those who did unlocked the report afterwards anyway - the
    // same credits in two steps with a locked page in between. The price is
    // still on screen before anything is committed, which is what the choice
    // was really carrying.
    render(<CVUploader onUploadSuccess={() => {}} />);

    expect(screen.getByText('credits.cost:3')).toBeInTheDocument();
    expect(screen.getByText('uploader.included')).toBeInTheDocument();
  });

  it('offers nothing to choose between', () => {
    render(<CVUploader onUploadSuccess={() => {}} />);

    expect(screen.queryByText(/uploader\.tier/)).not.toBeInTheDocument();
    expect(screen.queryByText('credits.cost:1')).not.toBeInTheDocument();
  });

  it('quotes the same price on the button', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    render(<CVUploader onUploadSuccess={() => {}} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, new File(['x'], 'cv.pdf', { type: 'application/pdf' }));

    expect(screen.getByText('uploader.analyzeButtonCost:3')).toBeInTheDocument();
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

  it('quotes no price on the anonymous /try flow, which spends nothing', () => {
    render(<CVUploader anonymous onUploadSuccess={() => {}} />);

    expect(screen.queryByText('credits.cost:3')).not.toBeInTheDocument();
    expect(screen.queryByText('uploader.included')).not.toBeInTheDocument();
  });
});

describe('CVUploader when the balance is short', () => {
  async function submit(props: Partial<Parameters<typeof CVUploader>[0]> = {}) {
    const { default: userEvent } = await import('@testing-library/user-event');
    const api = (await import('../../services/api')).default as any;
    api.post.mockRejectedValueOnce({
      response: { status: 402, data: { detail: 'Not enough credits: this costs 3, you have 1.' } },
    });
    render(<CVUploader onUploadSuccess={() => {}} {...props} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, new File(['x'], 'cv.pdf', { type: 'application/pdf' }));
    await userEvent.click(screen.getByText(/uploader\.analyzeButton/));
  }

  it('hands the refusal to the page with the price of an analysis', async () => {
    const onOutOfCredits = vi.fn();
    await submit({ onOutOfCredits });
    await waitFor(() => expect(onOutOfCredits).toHaveBeenCalledWith(3));
  });

  it('never treats a refused /try upload as a credit problem', async () => {
    // Anonymous uploads spend no credits; a 402 there is not ours to explain.
    const onOutOfCredits = vi.fn();
    await submit({ anonymous: true, onOutOfCredits });
    await new Promise((r) => setTimeout(r, 50));
    expect(onOutOfCredits).not.toHaveBeenCalled();
  });
});
