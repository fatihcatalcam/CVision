import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * An unreadable CV is how /try most often fails: 22% of uploads in September
 * 2026, and two in three that month's final week among visitors who never
 * signed up. It used to end on one sentence and a "Try again" button, and 45
 * of those failures came from just 26 files - people re-uploading the same
 * thing. These pin the screen that replaced it.
 */

const get = vi.fn();
vi.mock('../../services/api', () => ({ default: { get: (...a: unknown[]) => get(...a) } }));

const clearAnonToken = vi.fn();
vi.mock('../../services/anonymousAnalysis', () => ({
  clearAnonToken: () => clearAnonToken(),
  saveAnonToken: vi.fn(),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

// The real uploader needs a file and a request; all that matters here is what
// happens once the upload has been accepted.
vi.mock('../../components/cv/CVUploader', () => ({
  CVUploader: ({ onUploadSuccess }: { onUploadSuccess: (token: string) => void }) => (
    <button onClick={() => onUploadSuccess('tok-1')}>fake-upload</button>
  ),
}));
vi.mock('../../components/ui/ThemeToggle', () => ({ ThemeToggle: () => null }));
vi.mock('../../components/ui/LanguageSwitcher', () => ({ LanguageSwitcher: () => null }));
vi.mock('../../hooks/useSeo', () => ({ useSeo: () => {} }));
vi.mock('../../hooks/useLocalizedNav', () => ({
  useLocalizedNav: () => ({ go: vi.fn(), href: (p: string) => p, lang: 'tr' }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'tr' } }),
}));

import { TryPage } from './TryPage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <TryPage />
    </MemoryRouter>,
  );

async function uploadUnreadable() {
  get.mockImplementation((url: string) =>
    url.endsWith('/status')
      ? Promise.resolve({ data: { status: 'failed_no_text' } })
      : Promise.reject(new Error(`unexpected GET ${url}`)),
  );
  renderPage();
  await userEvent.click(screen.getByText('fake-upload'));
  return screen.findByTestId('image-pdf-help');
}

beforeEach(() => {
  get.mockReset();
  clearAnonToken.mockReset();
  navigate.mockReset();
});

describe('TryPage with an unreadable CV', () => {
  it('explains the problem and how to fix it, not just that it failed', async () => {
    await uploadUnreadable();

    expect(screen.getByText('imagePdf.title')).toBeInTheDocument();
    // All three ways people end up here, including the one the old copy
    // ignored: a CV that only exists as a photo.
    expect(screen.getByText('imagePdf.fixWord')).toBeInTheDocument();
    expect(screen.getByText('imagePdf.fixCanva')).toBeInTheDocument();
    expect(screen.getByText('imagePdf.fixPhoto')).toBeInTheDocument();
    expect(screen.getByText('imagePdf.check')).toBeInTheDocument();
    expect(screen.queryByText('try.tryAgain')).not.toBeInTheDocument();
  });

  it('does not tell an anonymous visitor about a refund they never needed', async () => {
    await uploadUnreadable();
    expect(screen.queryByText('imagePdf.refunded')).not.toBeInTheDocument();
  });

  it('sends the visitor back to pick a different file', async () => {
    await uploadUnreadable();

    await userEvent.click(screen.getByRole('button', { name: 'imagePdf.uploadOther' }));

    expect(screen.queryByTestId('image-pdf-help')).not.toBeInTheDocument();
    expect(screen.getByText('fake-upload')).toBeInTheDocument();
  });

  it('forgets the failed upload, so signing up does not claim it', async () => {
    // Left behind, the token made signup claim the failure and open the new
    // account on this same error screen.
    await uploadUnreadable();
    expect(clearAnonToken).toHaveBeenCalled();
  });

  it('offers signup as the next step, tagged with where it came from', async () => {
    await uploadUnreadable();

    await userEvent.click(screen.getByRole('button', { name: /imagePdf\.signupCta/ }));

    expect(navigate).toHaveBeenCalledWith('/register?from=try-image-pdf');
  });

  it('still shows the plain error for any other failure', async () => {
    get.mockResolvedValue({ data: { status: 'failed' } });
    renderPage();
    await userEvent.click(screen.getByText('fake-upload'));

    expect(await screen.findByText('try.errorGeneric')).toBeInTheDocument();
    expect(screen.queryByTestId('image-pdf-help')).not.toBeInTheDocument();
    await waitFor(() => expect(clearAnonToken).not.toHaveBeenCalled());
  });
});
