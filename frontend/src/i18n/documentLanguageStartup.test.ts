import { describe, it, expect, vi } from 'vitest';

/**
 * The first-load case, in its own file on purpose.
 *
 * i18next is a singleton: once any test has imported the i18n module, its
 * languageChanged listener stays attached, so a later re-import still corrects
 * the attribute and the bug hides. Vitest gives each FILE a fresh module
 * registry, and vi.hoisted runs before the imports are evaluated - which is the
 * only way to observe the document as it is when the app boots.
 */

// Runs before the import below. This is what the prerendered HTML ships.
// A visitor who chose English earlier: on a bare path an English browser alone
// no longer switches away from Turkish (see bareLanguage in ./index).
vi.hoisted(() => {
  document.documentElement.lang = 'tr';
  localStorage.setItem('cvision_lang', 'en');
});

describe('<html lang> on first load', () => {
  it('is corrected even though no change event ever fires', async () => {
    const { default: i18n } = await import('./index');

    // The stored choice is English, so the detected language is not tr.
    expect(i18n.language.split('-')[0]).not.toBe('tr');
    // Nothing called changeLanguage: only the startup path can have fixed this.
    expect(document.documentElement.lang).toBe(i18n.language.split('-')[0]);
  });
});
