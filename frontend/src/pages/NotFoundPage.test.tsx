import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { NotFoundPage } from './NotFoundPage';

/**
 * The page an unknown URL lands on.
 *
 * It used to be `<Navigate to="/dashboard" />`, so a logged-out visitor with a
 * stale link was bounced to a protected route and from there to /login, with
 * nothing anywhere saying why.
 *
 * The noindex assertions are the ones that matter most. Vercel rewrites every
 * path to index.html, so a missing page answers HTTP 200 and Google reads it as
 * a soft 404. noindex is the fix - and it has to be removed again on unmount,
 * because a robots tag left behind after navigating away would de-index a real
 * page, which is a far worse bug than the one it was added to solve.
 */

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

let currentUser: { full_name: string } | null = null;
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: currentUser }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

const robots = () => document.head.querySelector('meta[name="robots"]');

const renderPage = () =>
  render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  navigate.mockClear();
  currentUser = null;
  robots()?.remove();
});

describe('NotFoundPage', () => {
  it('says the page does not exist instead of redirecting', () => {
    renderPage();

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('notFound.heading')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('keeps the missing page out of the index', () => {
    renderPage();

    expect(robots()?.getAttribute('content')).toBe('noindex, nofollow');
  });

  it('gives the site-wide robots directive back when you leave', () => {
    // index.html ships <meta name="robots" content="index, follow">. The first
    // version of this test asserted the tag was GONE after unmount, which the
    // implementation duly did - quietly stripping a deliberate site-wide
    // directive from every page the visitor saw next. Restoring is the
    // requirement; removing only applies when nothing was there to begin with.
    const site = document.createElement('meta');
    site.setAttribute('name', 'robots');
    site.setAttribute('content', 'index, follow');
    document.head.appendChild(site);

    const { unmount } = renderPage();
    expect(robots()?.getAttribute('content')).toBe('noindex, nofollow');

    unmount();

    expect(robots()?.getAttribute('content')).toBe('index, follow');
  });

  it('removes the tag entirely when the page had none of its own', () => {
    const { unmount } = renderPage();
    expect(robots()).not.toBeNull();

    unmount();

    expect(robots()).toBeNull();
  });

  it('offers the free analysis to a visitor who is not signed in', async () => {
    renderPage();

    await userEvent.click(screen.getByText('notFound.tryFree'));

    expect(navigate).toHaveBeenCalledWith('/try');
  });

  it('offers the dashboard to someone who is signed in', async () => {
    currentUser = { full_name: 'Test User' };
    renderPage();

    await userEvent.click(screen.getByText('notFound.dashboard'));

    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });

  it('always offers the way home', async () => {
    renderPage();

    await userEvent.click(screen.getByText('notFound.home'));

    expect(navigate).toHaveBeenCalledWith('/');
  });
});
