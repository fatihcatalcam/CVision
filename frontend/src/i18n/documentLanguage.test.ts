import { describe, it, expect, beforeEach } from 'vitest';
import i18n from './index';

/**
 * <html lang> has to follow the UI language, not the static HTML it started as.
 *
 * CSS `text-transform: uppercase` applies the document language's casing rules,
 * and Turkish uppercases "i" as "İ". The prerendered HTML ships lang="tr"
 * because its copy really is Turkish, so an English UI that never corrected the
 * attribute uppercased its own labels through Turkish rules: "LATEST ANALYSİS",
 * "HİGH PRİORİTY", "SKİLLS".
 *
 * The fault was that this only ran on `languageChanged`, and the language
 * detected at startup is not a change - so a fresh load never corrected it, and
 * switching language by hand fixed it until the next reload.
 */

describe('<html lang>', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });


  it('follows a language switch', async () => {
    await i18n.changeLanguage('tr');
    expect(document.documentElement.lang).toBe('tr');

    await i18n.changeLanguage('de');
    expect(document.documentElement.lang).toBe('de');
  });

  it('never leaves Turkish casing rules on an English UI', async () => {
    await i18n.changeLanguage('en');

    expect(document.documentElement.lang).toBe('en');
    // The symptom, reproduced through the same rules the browser applies.
    expect('Analysis'.toLocaleUpperCase(document.documentElement.lang)).toBe('ANALYSIS');
    expect('Analysis'.toLocaleUpperCase('tr')).toBe('ANALYSİS');
  });

  it('falls back to en for a language we do not ship', async () => {
    await i18n.changeLanguage('ja');
    expect(document.documentElement.lang).toBe('en');
  });

  it('strips a region tag', async () => {
    await i18n.changeLanguage('tr-TR');
    expect(document.documentElement.lang).toBe('tr');
  });
});
