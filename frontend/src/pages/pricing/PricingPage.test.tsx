import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PricingPage } from './PricingPage';

/**
 * The page that takes money.
 *
 * Two things here have already gone wrong in production and neither was
 * visible to a backend test: the cards rendered with no price at all, and once
 * prices appeared they were labelled in dollars over amounts set in lira,
 * because the currency lives on the Lemon Squeezy store rather than the
 * variant. Both are silent - the page looks fine, it just tells the buyer the
 * wrong thing.
 */

const get = vi.fn();
const post = vi.fn();

vi.mock('../../services/api', () => ({
  default: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

vi.mock('../../hooks/useSeo', () => ({ useSeo: vi.fn() }));

let currentUser: { credits: number } | null = { credits: 4 };
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: currentUser }),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.credits !== undefined) return `${key}:${opts.credits}`;
      if (opts?.percent !== undefined) return `${key}:${opts.percent}`;
      if (opts?.price !== undefined) return `${key}:${opts.price}`;
      if (opts?.count !== undefined) return `${key}:${opts.count}`;
      return key;
    },
    i18n: { language: 'tr' },
  }),
}));

const PACKS = [
  { variant_id: '111', credits: 10, price: 7999, currency: 'TRY' },
  { variant_id: '222', credits: 30, price: 17999, currency: 'TRY' },
  { variant_id: '333', credits: 70, price: 34999, currency: 'TRY' },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <PricingPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  currentUser = { credits: 4 };
  get.mockResolvedValue({ data: { packs: PACKS } });
  post.mockResolvedValue({ data: { checkoutUrl: 'https://checkout.example/x' } });
});

describe('PricingPage', () => {
  it('states a price on every pack before asking anyone to buy', async () => {
    renderPage();

    await screen.findByText('10');
    // Exact matches: "79,99" is a substring of "179,99", so a loose matcher
    // would pass even if a pack rendered no price of its own.
    expect(screen.getByText('₺79,99')).toBeInTheDocument();
    expect(screen.getByText('₺179,99')).toBeInTheDocument();
    expect(screen.getByText('₺349,99')).toBeInTheDocument();
  });

  it('labels prices in the store currency, not dollars', async () => {
    renderPage();

    await screen.findByText('10');
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/₺/).length).toBeGreaterThan(0);
  });

  it('backs the "most popular" badge with a real saving', async () => {
    renderPage();

    await screen.findByText('30');
    // Computed from unrounded unit prices: 599.97 and 499.99 kuruş per credit
    // against 799.90 on the smallest pack. Reading them off the rounded
    // display values instead would give 25% and 38%, which is how the number
    // on the page and the number in someone's head drift apart.
    expect(screen.getByText('packs.saving:25')).toBeInTheDocument();
    expect(screen.getByText('packs.saving:37')).toBeInTheDocument();
  });

  it('sends the buyer to the checkout for the pack they picked', async () => {
    renderPage();
    const buttons = await screen.findAllByText('packs.buy');

    await userEvent.click(buttons[1]);

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/payment/lemon/create-checkout', {
        variant_id: '222',
      }),
    );
  });

  it('says nothing is on sale rather than showing empty cards', async () => {
    get.mockResolvedValue({ data: { packs: [] } });
    renderPage();

    expect(await screen.findByText('packs.notOnSale')).toBeInTheDocument();
    expect(screen.queryByText('packs.buy')).not.toBeInTheDocument();
  });

  it('renders a pack Lemon could not price rather than inventing a number', async () => {
    get.mockResolvedValue({
      data: { packs: [{ variant_id: '111', credits: 10, price: null, currency: null }] },
    });
    renderPage();

    expect(await screen.findByText('10')).toBeInTheDocument();
    expect(screen.getByText('packs.buy')).toBeInTheDocument();
    expect(screen.queryByText(/NaN|undefined|0,00/)).not.toBeInTheDocument();
  });
});

/**
 * The logged-out visitor.
 *
 * This route lived inside ProtectedRoute until now, so this whole path is new:
 * nobody could reach the page without a session, and the component had never
 * had to cope with `user` being null. Making it public without covering that is
 * how you ship a Buy button that answers 401 to the one person who was ready
 * to pay.
 */
describe('PricingPage, signed out', () => {
  beforeEach(() => {
    currentUser = null;
  });

  it('shows the prices without asking anyone to sign in first', async () => {
    renderPage();

    await screen.findByText('10');
    expect(screen.getByText('₺79,99')).toBeInTheDocument();
    // The balance line is the one thing that needs a session.
    expect(screen.queryByText(/packs\.currentBalance/)).not.toBeInTheDocument();
  });

  it('offers signup instead of a checkout it cannot start', async () => {
    renderPage();

    const buttons = await screen.findAllByText('packs.signUpToBuy');
    expect(screen.queryByText('packs.buy')).not.toBeInTheDocument();

    await userEvent.click(buttons[1]);

    expect(navigate).toHaveBeenCalledWith('/register');
    // The important half: no request went out to be refused.
    expect(post).not.toHaveBeenCalled();
  });

  it('still explains the credit model when the packs fail to load', async () => {
    // Someone arriving from a search result gets nothing else to read if the
    // Lemon Squeezy call is down - the copy is the page, not the cards.
    get.mockRejectedValue(new Error('lemon down'));
    renderPage();

    expect(await screen.findByText('packs.seo.h2a')).toBeInTheDocument();
    expect(screen.getByText('packs.seo.p1')).toBeInTheDocument();
    expect(screen.getByText('packs.seo.h2b')).toBeInTheDocument();
  });
});

/**
 * A pack smaller than one full application.
 *
 * Every pack used to cover at least one application (analysis, report, job
 * match, cover letter - 7 credits), so the card described itself in those.
 * A 3-credit pack exists for the person who wants one more analysis and will
 * not pay for ten credits to get it; described in applications it would read
 * "about 0", and adding it as a fourth pack also dropped the "most popular"
 * badge, which was only drawn when there were exactly three.
 */
describe('PricingPage with a pack smaller than an application', () => {
  const WITH_SMALL = [
    { variant_id: '000', credits: 3, price: 2999, currency: 'TRY' },
    ...PACKS,
  ];

  beforeEach(() => {
    get.mockResolvedValue({ data: { packs: WITH_SMALL } });
  });

  it('describes it in analyses rather than as zero applications', async () => {
    renderPage();
    await screen.findByText('3');

    expect(screen.queryByText('packs.worth:0')).not.toBeInTheDocument();
    expect(screen.getByText('packs.worthAnalyses:1')).toBeInTheDocument();
  });

  it('still features the pack that covers a real search', async () => {
    renderPage();

    const badge = await screen.findByText('packs.popular');
    const card = badge.parentElement as HTMLElement;
    expect(card).toHaveTextContent('30');
  });
});

/**
 * The page that sells credits was arguing against buying them. Directly under
 * the packs - the moment of decision - a highlighted box read "you can keep
 * going without buying credits: free credits arrive every week". The same
 * facts stay on the page, in the explanation of how credits work further down;
 * what goes is the callout placed between the buyer and the buy button.
 */
describe('PricingPage at the moment of decision', () => {
  it('does not advertise the free alternative right under the packs', async () => {
    renderPage();
    await screen.findByText('10');

    expect(screen.queryByText('packs.freeRoutes')).not.toBeInTheDocument();
  });

  it('still explains the weekly credits where the credit model is explained', async () => {
    renderPage();
    await screen.findByText('10');

    expect(screen.getByText('packs.seo.p2')).toBeInTheDocument();
  });
});
