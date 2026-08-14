import { describe, it, expect } from 'vitest';
import {
  splitLangPath,
  localizedPath,
  localizedUrl,
  isLocalizedPath,
  LOCALIZED_PATHS,
  URL_LANGUAGES,
} from './routes';

/**
 * The mapping between the two URL trees.
 *
 * Everything downstream trusts it: the canonical each page publishes, the
 * hreflang set that has to be reciprocal or Google throws it away, the sitemap,
 * the language the URL forces on i18next, and where the language switcher
 * sends you. A wrong answer here is not a broken link - it is a page telling
 * search engines it is a duplicate of its own translation.
 */

describe('splitLangPath', () => {
  it('reads the language out of a prefixed path', () => {
    expect(splitLangPath('/en/try')).toEqual({ lang: 'en', path: '/try' });
    expect(splitLangPath('/en/how-ats-works')).toEqual({ lang: 'en', path: '/how-ats-works' });
  });

  it('treats a bare path as the default language', () => {
    expect(splitLangPath('/try')).toEqual({ lang: 'tr', path: '/try' });
    expect(splitLangPath('/')).toEqual({ lang: 'tr', path: '/' });
  });

  it('maps the bare prefix to that language\'s homepage', () => {
    expect(splitLangPath('/en')).toEqual({ lang: 'en', path: '/' });
  });

  it('is not fooled by a path that merely starts with the letters', () => {
    // "/enterprise" is not the English tree. Matching on the prefix as a
    // string rather than as a whole segment is the classic way to break this.
    expect(splitLangPath('/enterprise')).toEqual({ lang: 'tr', path: '/enterprise' });
  });

  it('ignores a trailing slash', () => {
    // vercel.json redirects these away, but a hand-typed URL still reaches the
    // client router, and /en/try/ must not resolve to a different page.
    expect(splitLangPath('/en/try/')).toEqual({ lang: 'en', path: '/try' });
    expect(splitLangPath('/try/')).toEqual({ lang: 'tr', path: '/try' });
  });

  it('leaves untranslated app routes on the default language', () => {
    expect(splitLangPath('/dashboard')).toEqual({ lang: 'tr', path: '/dashboard' });
  });
});

describe('per-language slugs', () => {
  const HOWTO = '/ats-uyumlu-cv-nasil-hazirlanir';

  it('gives the how-to guide a different slug in each language', () => {
    // The slug is the strongest on-page signal a URL carries. Serving
    // /en/ats-uyumlu-cv-nasil-hazirlanir would spend it on a phrase no English
    // speaker searches for.
    expect(localizedPath(HOWTO, 'tr')).toBe(HOWTO);
    expect(localizedPath(HOWTO, 'en')).toBe('/en/how-to-write-an-ats-friendly-cv');
  });

  it('resolves either language\'s slug back to the same page', () => {
    // Everything downstream compares against one id, whichever spelling arrived.
    expect(splitLangPath('/en/how-to-write-an-ats-friendly-cv')).toEqual({
      lang: 'en',
      path: HOWTO,
    });
    expect(splitLangPath(HOWTO)).toEqual({ lang: 'tr', path: HOWTO });
  });

  it('does not resolve a slug belonging to the other language', () => {
    // /en/ats-uyumlu-cv-nasil-hazirlanir is not a page. It must not quietly
    // resolve to the how-to guide, or two URLs would serve it.
    const { path } = splitLangPath('/en/ats-uyumlu-cv-nasil-hazirlanir');
    expect(path).toBe('/ats-uyumlu-cv-nasil-hazirlanir');
    expect(isLocalizedPath(path)).toBe(true);
    // ...but the canonical for that page in English is the English slug, so the
    // page never advertises the Turkish spelling under /en.
    expect(localizedUrl(path, 'en')).toContain('/en/how-to-write-an-ats-friendly-cv');
  });
});

describe('localizedPath', () => {
  it('leaves the default language unprefixed', () => {
    // Turkish holds the bare paths on purpose: it is the traffic and the
    // rankings, and moving it under /tr would re-point every indexed URL.
    expect(localizedPath('/try', 'tr')).toBe('/try');
    expect(localizedPath('/', 'tr')).toBe('/');
  });

  it('prefixes the others', () => {
    expect(localizedPath('/try', 'en')).toBe('/en/try');
    expect(localizedPath('/', 'en')).toBe('/en');
  });

  it('round-trips with splitLangPath for every path and language', () => {
    for (const lang of URL_LANGUAGES) {
      for (const p of LOCALIZED_PATHS) {
        expect(splitLangPath(localizedPath(p, lang))).toEqual({ lang, path: p });
      }
    }
  });
});

describe('localizedUrl', () => {
  it('builds absolute URLs for canonical and hreflang', () => {
    expect(localizedUrl('/try', 'tr')).toBe('https://www.cvisionapp.com/try');
    expect(localizedUrl('/try', 'en')).toBe('https://www.cvisionapp.com/en/try');
    expect(localizedUrl('/', 'tr')).toBe('https://www.cvisionapp.com/');
    expect(localizedUrl('/', 'en')).toBe('https://www.cvisionapp.com/en');
  });

  it('never emits the same URL for two languages', () => {
    // If it did, both pages would canonicalise to one address and the second
    // language would simply not exist as far as search is concerned.
    for (const p of LOCALIZED_PATHS) {
      const urls = URL_LANGUAGES.map((l) => localizedUrl(p, l));
      expect(new Set(urls).size, `${p} collides across languages`).toBe(urls.length);
    }
  });
});

describe('isLocalizedPath', () => {
  it('accepts the public pages', () => {
    expect(isLocalizedPath('/try')).toBe(true);
    expect(isLocalizedPath('/')).toBe(true);
  });

  it('rejects everything behind login', () => {
    // hreflang must not be advertised for these. The tags are static in the
    // prerendered HTML, so navigating from /try into /dashboard has to clear
    // them rather than leave /try's alternates on a page they do not describe.
    expect(isLocalizedPath('/dashboard')).toBe(false);
    expect(isLocalizedPath('/settings')).toBe(false);
    expect(isLocalizedPath('/analysis/42')).toBe(false);
  });
});
