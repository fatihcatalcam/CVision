import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AnalysisPage } from './AnalysisPage';

/**
 * The unlock flow: the most expensive screen in the product to get wrong.
 * Money leaves the account here, and what arrives in return is the product.
 *
 * These drive the real component - locked cards, a click, the server's reply,
 * and what is on the screen afterwards - and cover: the paid text really is
 * absent before purchase, it appears after, the balance is refreshed, a refusal
 * is recoverable, and a rewrite renders as clean before/after text (the
 * mojibake-arrow bug that put  " -> "  inside every red box).
 *
 * What these do NOT cover, stated plainly so nobody trusts them for it: the
 * grey-screen regression, where unlocking charged 2 credits and left a blank
 * page. That was attributed to the suggestion card declaring useState below an
 * early return, so a mounted locked card gained hooks when it opened. Reverting
 * that fix and re-running this file leaves all five tests green, and a direct
 * probe shows React 19 neither throws nor warns when a mounted child gains
 * hooks this way. So either the original diagnosis was incomplete or the fault
 * needs conditions a jsdom render does not reproduce. The fix stays because
 * hooks above an early return is correct regardless - but it is unguarded, and
 * pretending otherwise would be worse than saying so.
 */

const post = vi.fn();
const get = vi.fn();

vi.mock('../../services/api', () => ({
  default: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useParams: () => ({ id: 'abc123' }), useNavigate: () => vi.fn() };
});

const refreshUser = vi.fn().mockResolvedValue(undefined);
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { credits: 5, role: 'user' }, refreshUser }),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts?.cost !== undefined ? `${key}:${opts.cost}` : key,
    i18n: { language: 'en' },
  }),
}));

const SCORES = {
  overall_score: 72, ats_score: 72, keyword_score: 72,
  completeness_score: 72, experience_score: 72,
};

const lockedReport = {
  id: 'a1', cv_id: 'abc123', scores: SCORES,
  summary: 'Summary', strengths: [], weaknesses: [],
  extracted_text: 'CV text', suggestions: [], extracted_skills: [],
  ai_summary: 'Truncated preview...', is_summary_locked: true,
  ai_enhanced: true, layout_xray: null,
  ai_suggestions: [
    { category: 'experience', priority: 'high', is_locked: false,
      message: 'The free one', rewrite_hint: '' },
    { category: 'skills', priority: 'medium', is_locked: true,
      message: null, rewrite_hint: null },
    { category: 'ats', priority: 'low', is_locked: true,
      message: null, rewrite_hint: null },
  ],
};

const unlockedReport = {
  ...lockedReport,
  is_summary_locked: false,
  ai_summary: 'The full executive summary, now paid for.',
  ai_suggestions: [
    { category: 'experience', priority: 'high', is_locked: false,
      message: 'The free one', rewrite_hint: '' },
    { category: 'skills', priority: 'medium', is_locked: false,
      message: 'The second tip',
      rewrite_hint: `Before: "Old wording" -> After: "New wording"` },
    { category: 'ats', priority: 'low', is_locked: false,
      message: 'The third tip', rewrite_hint: '' },
  ],
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <AnalysisPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  get.mockResolvedValue({ data: lockedReport });
  post.mockResolvedValue({ data: unlockedReport });
});

describe('AnalysisPage unlock flow', () => {
  it('withholds the paid suggestions until they are bought', async () => {
    renderPage();

    expect(await screen.findByText('The free one')).toBeInTheDocument();
    expect(screen.queryByText('The second tip')).not.toBeInTheDocument();
    expect(screen.getAllByText('analysis.unlockCta:2').length).toBeGreaterThan(0);
  });

  it('shows the report after unlocking instead of a blank page', async () => {
    // The grey-screen regression: the page must survive locked cards becoming
    // unlocked while mounted.
    renderPage();
    const buttons = await screen.findAllByText('analysis.unlockCta:2');

    await userEvent.click(buttons[0]);

    await waitFor(() => expect(post).toHaveBeenCalledWith('/analysis/abc123/unlock'));
    expect(await screen.findByText('The second tip')).toBeInTheDocument();
    expect(screen.getByText('The third tip')).toBeInTheDocument();
    // Still the real page, not a torn-down tree.
    expect(screen.getByText('The free one')).toBeInTheDocument();
  });

  it('refreshes the balance so the header does not show stale credits', async () => {
    renderPage();
    const buttons = await screen.findAllByText('analysis.unlockCta:2');

    await userEvent.click(buttons[0]);

    await waitFor(() => expect(refreshUser).toHaveBeenCalled());
  });

  it('leaves the report locked when the server refuses', async () => {
    post.mockRejectedValue({ response: { data: { detail: 'Not enough credits' } } });
    renderPage();
    const buttons = await screen.findAllByText('analysis.unlockCta:2');

    await userEvent.click(buttons[0]);

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(screen.queryByText('The second tip')).not.toBeInTheDocument();
    // And the button comes back, so a 402 is recoverable rather than terminal.
    expect(await screen.findAllByText('analysis.unlockCta:2')).not.toHaveLength(0);
  });

  it('renders a rewrite as clean before/after text, with no stray arrow', async () => {
    get.mockResolvedValue({ data: unlockedReport });
    renderPage();

    // Cards past the first start collapsed; the rewrite lives inside one.
    await userEvent.click(await screen.findByText('The second tip'));

    // The panel wraps each half in quotes of its own, hence the regex: what
    // matters is that the model's own quotes and the arrow are gone.
    expect(await screen.findByText(/^"Old wording"$/)).toBeInTheDocument();
    expect(screen.getByText(/^"New wording"$/)).toBeInTheDocument();
    expect(screen.queryByText(/->/)).not.toBeInTheDocument();
  });
});
