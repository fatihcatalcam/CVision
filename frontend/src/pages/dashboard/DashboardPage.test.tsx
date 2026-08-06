import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';

/**
 * What a user with no analyses yet sees.
 *
 * This used to be EmptyState: a separate marketing page whose banner promised
 * "your first analysis is fully AI-powered and free" and "you get 3 free
 * analyses after signing up". Both stopped being true when credits replaced the
 * weekly quota, and the page showed neither the balance nor what an analysis
 * costs - the two facts that decide the very next click.
 *
 * These lock in the replacement: the ordinary dashboard, minus the cards that
 * would have nothing to show.
 */

const summary = {
  total_cvs: 0, total_analyses: 0, average_score: null, latest_score: null,
  latest_ats_score: null, latest_keyword_score: null, latest_completeness_score: null,
  latest_analysis_id: null, latest_cv_id: null, score_delta: null,
  latest_role_title: null, latest_role_match: null, top_suggestion: null,
};

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url.startsWith('/dashboard/summary')) return Promise.resolve({ data: summary });
      if (url.startsWith('/dashboard/history')) return Promise.resolve({ data: { items: [] } });
      // No packs on sale, which is the live configuration today.
      if (url.startsWith('/payment/packs')) return Promise.resolve({ data: { packs: [] } });
      return Promise.reject(new Error(`unexpected GET ${url}`));
    }),
    post: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { full_name: 'Test User', email: 't@e.st', credits: 3, role: 'user', plan_type: 'free' },
    logout: vi.fn(),
    refreshUser: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Echo the key so assertions do not depend on any one language's wording.
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );

describe('Dashboard with no analyses yet', () => {
  it('offers the analysis straight away, with no separate landing page', async () => {
    renderDashboard();

    expect(await screen.findByText('dashboard.firstRun.title')).toBeInTheDocument();
    expect(screen.getByText('uploader.dropHeading')).toBeInTheDocument();
  });

  it('shows the balance and the price, which the old empty state hid', async () => {
    renderDashboard();

    // The credit card is in the sidebar, same as for everyone else. Scoped to
    // that card because the uploader's step indicator also renders a "3".
    const creditCard = (await screen.findByText('credits.label')).closest('.surface')!;
    expect(within(creditCard as HTMLElement).getByText('3')).toBeInTheDocument();

    // And the tier choice states what each one costs before anything is spent.
    expect(screen.getByText('uploader.tier.normalTitle')).toBeInTheDocument();
    expect(screen.getByText('uploader.tier.proTitle')).toBeInTheDocument();
  });

  it('does not send anyone to a checkout while no pack is on sale', async () => {
    renderDashboard();

    await screen.findByText('credits.label');
    expect(screen.queryByText('credits.buyCta')).not.toBeInTheDocument();
  });
});
