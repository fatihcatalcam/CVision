import { describe, it, expect } from 'vitest';

/**
 * A bare path is a Turkish page, whatever language the browser asks for.
 *
 * Search engines render pages with an English browser and nothing stored, and
 * the bare paths used to follow the browser: once the app mounted, /about,
 * /pricing and the CV guide carried the same English title and description as
 * /en/about, /en/pricing and /en/how-to-write-an-ats-friendly-cv. Bing listed
 * every pair as duplicate titles.
 *
 * Own file: i18next is a singleton, and this checks what it picks on startup.
 * jsdom serves "/" with an English navigator and empty storage - exactly the
 * crawler's case.
 */

describe('language on a bare path', () => {
  it('stays Turkish for an English browser with nothing stored', async () => {
    const { default: i18n } = await import('./index');

    expect(window.location.pathname).toBe('/');
    expect(navigator.language.startsWith('en')).toBe(true);
    expect(i18n.language).toBe('tr');
  });

  it('still follows a browser asking for a language that has no URL of its own', async () => {
    const { bareLanguage } = await import('./index');

    expect(bareLanguage(['de-DE', 'en-US'])).toBe('de');
    expect(bareLanguage(['en-GB', 'fr-FR'])).toBe('fr');
    expect(bareLanguage(['es'])).toBe('es');
    expect(bareLanguage(['tr-TR'])).toBe('tr');
  });

  it('never lets English take over a Turkish page', async () => {
    const { bareLanguage } = await import('./index');

    expect(bareLanguage(['en-US'])).toBe('tr');
    expect(bareLanguage(['en-US', 'en'])).toBe('tr');
    expect(bareLanguage([])).toBe('tr');
  });
});
