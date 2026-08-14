import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useLocalizedNav } from './useLocalizedNav';

/**
 * Links that stay inside the visitor's language tree.
 *
 * Every public page hard-coded its destinations, which was right while there
 * was one tree. With /en it meant the English About page's "back to home" link
 * pointed at the TURKISH homepage - the visitor thrown into another language
 * mid-session, and a crawler following the English page's links leaving the
 * English tree on the first hop, immediately after its hreflang set promised
 * otherwise.
 */

function Probe() {
  const { href, go, lang } = useLocalizedNav();
  const location = useLocation();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="here">{location.pathname}</span>
      <a data-testid="home" href={href('/')}>home</a>
      <a data-testid="about" href={href('/about')}>about</a>
      <a data-testid="login" href={href('/login')}>login</a>
      <button onClick={() => go('/try')}>try</button>
    </div>
  );
}

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  );

describe('useLocalizedNav', () => {
  it('keeps links bare on the default tree', () => {
    renderAt('/about');

    expect(screen.getByTestId('lang')).toHaveTextContent('tr');
    expect(screen.getByTestId('home')).toHaveAttribute('href', '/');
    expect(screen.getByTestId('about')).toHaveAttribute('href', '/about');
  });

  it('prefixes links when the visitor is in the English tree', () => {
    renderAt('/en/about');

    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(screen.getByTestId('home')).toHaveAttribute('href', '/en');
    expect(screen.getByTestId('about')).toHaveAttribute('href', '/en/about');
  });

  it('leaves untranslated routes alone', () => {
    // /login exists once. Prefixing it would invent a 404 - there is no
    // /en/login route, and no reason for one.
    renderAt('/en/about');

    expect(screen.getByTestId('login')).toHaveAttribute('href', '/login');
  });

  it('navigates within the tree', async () => {
    renderAt('/en/about');

    await userEvent.click(screen.getByText('try'));

    expect(screen.getByTestId('here')).toHaveTextContent('/en/try');
  });

  it('navigates within the default tree too', async () => {
    renderAt('/about');

    await userEvent.click(screen.getByText('try'));

    expect(screen.getByTestId('here')).toHaveTextContent('/try');
  });
});
