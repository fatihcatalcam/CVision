import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('starts on Normal, so nobody is charged 3 by simply not choosing', () => {
    render(<CVUploader onUploadSuccess={() => {}} />);

    const normal = screen.getByText('uploader.tier.normalTitle').closest('button');
    const pro = screen.getByText('uploader.tier.proTitle').closest('button');

    expect(normal).toHaveAttribute('aria-pressed', 'true');
    expect(pro).toHaveAttribute('aria-pressed', 'false');
  });

  it('hides the choice on the anonymous /try flow, which has no balance', () => {
    render(<CVUploader anonymous onUploadSuccess={() => {}} />);

    expect(screen.queryByText('uploader.tier.normalTitle')).not.toBeInTheDocument();
    expect(screen.queryByText('uploader.tier.proTitle')).not.toBeInTheDocument();
  });
});
