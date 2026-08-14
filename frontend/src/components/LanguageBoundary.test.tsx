import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LanguageBoundary } from './LanguageBoundary';
import i18n from '../i18n';

/**
 * The boundary that pins /en to English.
 *
 * It runs against the REAL i18n singleton on purpose. The bug it exists to
 * prevent was an interaction with react-i18next, not with our own code, and a
 * mocked instance reproduces none of it: the first version called
 * useTranslation() and listed `i18n` in its dependency array. That hook returns
 * a fresh reference on every language change, so the effect woke up on language
 * changes as well as route changes and shoved the language back.
 *
 * Picking Turkish from the switcher on /en/about therefore went:
 * changeLanguage('tr') -> effect sees "want en, have tr" -> changeLanguage('en'),
 * all before the navigation to /about landed. The switcher looked dead. Nothing
 * failed, because nothing tested it.
 *
 * A separate test file because the i18n singleton is module state - it would
 * otherwise leak the language between unrelated suites.
 */

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/en" element={<LanguageBoundary lang="en" />}>
          <Route path="about" element={<p>page</p>} />
        </Route>
        <Route path="/about" element={<p>page</p>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('tr');
  });
});

describe('LanguageBoundary', () => {
  it('forces the tree language over whatever was stored', () => {
    expect(i18n.language).toBe('tr');

    renderAt('/en/about');

    expect(i18n.language).toBe('en');
  });

  it('leaves a later language change alone instead of reverting it', async () => {
    // The whole point. The visitor is on /en/about and picks Turkish; the
    // switcher changes the language and then navigates to /about. If the
    // boundary reacts to the language change it undoes the choice mid-flight
    // and the switcher does nothing at all.
    renderAt('/en/about');
    expect(i18n.language).toBe('en');

    await act(async () => {
      await i18n.changeLanguage('tr');
    });

    expect(i18n.language).toBe('tr');
  });

  it('does nothing on routes outside its tree', () => {
    renderAt('/about');

    expect(i18n.language).toBe('tr');
  });
});
