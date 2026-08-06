import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MatchPage } from './MatchPage';

/**
 * Job matching is priced, not gated.
 *
 * This page used to bounce anyone without plan_type === 'premium' straight to
 * /pricing, so the feature was unreachable for every user CVision has. The
 * backend charged credits for it the whole time - the gate was pure leftover
 * from the subscription.
 *
 * The price test is the one that matters: MATCH_COST has to be on screen before
 * the button is pressed, or the first a user learns of the cost is their balance
 * going down by two.
 */

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: { cvs: [] } })) },
}));

vi.mock('../../services/matchApi', () => ({
  fetchUrlText: vi.fn(),
  saveJD: vi.fn(),
  createMatch: vi.fn(),
  createCoverLetter: vi.fn(),
}));

let currentUser: { plan_type: string; credits: number } | null = null;

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: currentUser }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Echo the key so assertions do not depend on any one language's wording.
    t: (key: string, opts?: Record<string, unknown>) =>
      opts?.cost !== undefined ? `${key}:${opts.cost}`
      : opts?.credits !== undefined ? `${key}:${opts.credits}`
      : key,
    i18n: { language: 'en' },
  }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <MatchPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  navigate.mockClear();
  currentUser = { plan_type: 'free', credits: 4 };
});

describe('MatchPage', () => {
  // findByText rather than getByText throughout: the CV list resolves after the
  // first render, and asserting synchronously leaves that update unflushed.
  it('lets a free-plan user in instead of redirecting to pricing', async () => {
    renderPage();

    expect(await screen.findByText('match.pageTitle')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalledWith('/pricing');
  });

  it('states the price and the balance before anything is typed', async () => {
    renderPage();

    expect(await screen.findByText('credits.cost:2')).toBeInTheDocument();
    expect(screen.getByText(/packs.currentBalance:4/)).toBeInTheDocument();
  });

  it('renders for a signed-out visitor without crashing on the balance', async () => {
    currentUser = null;
    renderPage();

    expect(await screen.findByText('credits.cost:2')).toBeInTheDocument();
  });
});
