/**
 * Which URLs exist in which language.
 *
 * The site served every language from the same URL, deciding client-side from
 * localStorage and the browser's Accept-Language. That is fine for humans and
 * useless for search: there was no English URL to rank, so "ATS resume checker"
 * - a term with many times the Turkish volume - had nothing to point at, and
 * hreflang was impossible by construction. hreflang needs distinct URLs with
 * reciprocal tags; declaring tr/en/x-default all on "/" is a self-referential
 * signal Google discards.
 *
 * Turkish keeps the bare paths. It is ~80% of traffic and holds whatever
 * rankings exist, and moving it under /tr would ask Google to re-learn every
 * URL on the site for no gain. English gets /en/*.
 *
 * Spanish, German and French deliberately have NO urls. The UI is translated,
 * but there is no audience yet, and five thin trees of the same pages is how a
 * small site talks itself into a quality problem. They still switch in place.
 */

export const SITE = 'https://www.cvisionapp.com';

/** Languages with URLs of their own. The first is the unprefixed default. */
export const URL_LANGUAGES = ['tr', 'en'] as const;
export type UrlLanguage = (typeof URL_LANGUAGES)[number];

export const DEFAULT_URL_LANGUAGE: UrlLanguage = 'tr';

/** Public paths that exist in every URL language. Order is sitemap order. */
export const LOCALIZED_PATHS = [
  '/',
  '/try',
  '/how-ats-works',
  '/pricing',
  '/about',
  '/privacy',
  '/terms',
] as const;

export type LocalizedPath = (typeof LOCALIZED_PATHS)[number];

function isUrlLanguage(value: string): value is UrlLanguage {
  return (URL_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Split a pathname into its language and the path within that language.
 *
 * `/en/try` -> { lang: 'en', path: '/try' }
 * `/try`    -> { lang: 'tr', path: '/try' }
 * `/en`     -> { lang: 'en', path: '/' }
 */
export function splitLangPath(pathname: string): { lang: UrlLanguage; path: string } {
  // Trailing slashes are normalised away by vercel.json, but a pathname can
  // still arrive with one from a hand-typed URL or a test.
  const clean = pathname.replace(/\/+$/, '') || '/';
  const [, first = '', ...rest] = clean.split('/');

  if (isUrlLanguage(first) && first !== DEFAULT_URL_LANGUAGE) {
    return { lang: first, path: `/${rest.join('/')}`.replace(/\/$/, '') || '/' };
  }
  return { lang: DEFAULT_URL_LANGUAGE, path: clean };
}

/** The URL for `path` in `lang`. `('/try', 'en')` -> `/en/try`. */
export function localizedPath(path: string, lang: UrlLanguage): string {
  const base = path === '/' ? '' : path;
  return lang === DEFAULT_URL_LANGUAGE ? base || '/' : `/${lang}${base}`;
}

/** Absolute URL, for canonical and hreflang tags. */
export function localizedUrl(path: string, lang: UrlLanguage): string {
  const p = localizedPath(path, lang);
  return `${SITE}${p === '/' ? '/' : p}`;
}

/** True when this path is translated into every URL language. */
export function isLocalizedPath(path: string): path is LocalizedPath {
  return (LOCALIZED_PATHS as readonly string[]).includes(path);
}
