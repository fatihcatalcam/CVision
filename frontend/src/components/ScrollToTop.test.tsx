import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { ScrollToTop } from './ScrollToTop';

/**
 * Reported by the founder: scroll halfway down the dashboard, click "Buy
 * credits", and /pricing opens already scrolled halfway down - a page you have
 * never seen, starting in the middle. Nothing reset the window offset on a
 * client-side navigation, so it happened on every route.
 */

const scrollTo = vi.fn();

beforeEach(() => {
  scrollTo.mockClear();
  Object.defineProperty(window, 'scrollTo', { value: scrollTo, writable: true });
});

function Page({ name }: { name: string }) {
  return (
    <div>
      <p>page:{name}</p>
      <Link to="/pricing">pricing</Link>
      <Link to="/about#faq">about faq</Link>
    </div>
  );
}

const renderApp = (start: string) =>
  render(
    <MemoryRouter initialEntries={[start]}>
      <ScrollToTop />
      <Routes>
        <Route path="/dashboard" element={<Page name="dashboard" />} />
        <Route path="/pricing" element={<Page name="pricing" />} />
        <Route path="/about" element={<Page name="about" />} />
      </Routes>
    </MemoryRouter>,
  );

describe('ScrollToTop', () => {
  it('sends a new route to the top', async () => {
    renderApp('/dashboard');
    scrollTo.mockClear();

    await userEvent.click(screen.getByText('pricing'));

    expect(screen.getByText('page:pricing')).toBeInTheDocument();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  });

  it('scrolls instantly, not smoothly', () => {
    // index.css sets scroll-behavior: smooth for the in-page anchors. Without
    // an explicit 'instant' here a route change would animate all the way up
    // from wherever the previous page was left.
    renderApp('/dashboard');

    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'instant' }),
    );
  });

  it('leaves a hash navigation alone', async () => {
    // "#faq" is a request to scroll somewhere specific. Jumping to the top
    // first would either fight the anchor or beat it.
    renderApp('/dashboard');
    scrollTo.mockClear();

    await userEvent.click(screen.getByText('about faq'));

    expect(screen.getByText('page:about')).toBeInTheDocument();
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
