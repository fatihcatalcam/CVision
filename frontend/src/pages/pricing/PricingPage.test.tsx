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

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { credits: 4 } }),
}));

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
