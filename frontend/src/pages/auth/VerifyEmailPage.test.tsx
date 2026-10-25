import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * An email signup cannot sign in until it enters the code it was mailed. This
 * screen is where it does, and it took over the sign-in - and the claiming of a
 * pending /try analysis - that used to run right after registration.
 */

const post = vi.fn();
vi.mock('../../services/api', () => ({ default: { post: (...a: unknown[]) => post(...a) } }));

const claimPendingAnalysis = vi.fn();
vi.mock('../../services/anonymousAnalysis', () => ({
  claimPendingAnalysis: () => claimPendingAnalysis(),
}));

const login = vi.fn();
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ login }) }));

const toastError = vi.fn();
vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), { success: vi.fn(), error: (m: string) => toastError(m) }),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'tr' } }),
}));

import { VerifyEmailPage } from './VerifyEmailPage';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/verify-email?email=deniz%40test.com']}>
      <VerifyEmailPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('VerifyEmailPage', () => {
  it('signs in with the right code and lands on the dashboard', async () => {
    post.mockResolvedValue({ data: { access_token: 'jwt', user: { id: 1 } } });
    claimPendingAnalysis.mockResolvedValue(null);
    renderPage();

    await userEvent.type(screen.getByLabelText('auth.verifyEmail.codeLabel'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'auth.verifyEmail.verifyButton' }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/dashboard'));
    expect(post).toHaveBeenCalledWith('/auth/verify-email', { email: 'deniz@test.com', code: '123456' });
    expect(login).toHaveBeenCalledWith('jwt', { id: 1 });
  });

  it('opens the /try analysis the visitor made before signing up', async () => {
    post.mockResolvedValue({ data: { access_token: 'jwt', user: { id: 1 } } });
    claimPendingAnalysis.mockResolvedValue('abc');
    renderPage();

    await userEvent.type(screen.getByLabelText('auth.verifyEmail.codeLabel'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'auth.verifyEmail.verifyButton' }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/analysis/abc'));
  });

  it('keeps only digits and waits for all six', async () => {
    renderPage();
    const input = screen.getByLabelText('auth.verifyEmail.codeLabel');

    await userEvent.type(input, '12a3 4');

    expect(input).toHaveValue('1234');
    expect(screen.getByRole('button', { name: 'auth.verifyEmail.verifyButton' })).toBeDisabled();
  });

  it('explains an expired code in the user language', async () => {
    post.mockRejectedValue({ response: { data: { message: 'code_expired' } } });
    renderPage();

    await userEvent.type(screen.getByLabelText('auth.verifyEmail.codeLabel'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'auth.verifyEmail.verifyButton' }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('auth.verifyEmail.codeExpired'));
    expect(login).not.toHaveBeenCalled();
  });

  it('does not offer a resend straight away, since a code was just sent', () => {
    renderPage();

    expect(screen.getByRole('button', { name: 'auth.verifyEmail.resendIn' })).toBeDisabled();
  });
});
