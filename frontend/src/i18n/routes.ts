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

/**
 * Every public page, with the slug it uses in each language.
 *
 * The slug is per-language on purpose. A guide about writing an ATS-friendly CV
 * has to carry the Turkish phrase people search for in the Turkish URL and the
 * English one in the English URL; serving /en/ats-uyumlu-cv-nasil-hazirlanir
 * would waste the strongest on-page signal a URL has. Most pages happen to
 * share a slug because "try" and "pricing" are what both audiences type.
 *
 * The Turkish slug doubles as the page's internal id - the value passed around
 * as `path` everywhere else in the app - so adding a language never touches a
 * call site.
 */
const PAGES = [
  { tr: '/', en: '/' },
  { tr: '/try', en: '/try' },
  { tr: '/how-ats-works', en: '/how-ats-works' },
  {
    tr: '/ats-uyumlu-cv-nasil-hazirlanir',
    en: '/how-to-write-an-ats-friendly-cv',
  },
  { tr: '/pricing', en: '/pricing' },
  { tr: '/about', en: '/about' },
  { tr: '/privacy', en: '/privacy' },
  { tr: '/terms', en: '/terms' },
] as const satisfies readonly Record<UrlLanguage, string>[];

/** Page ids, which are also the Turkish paths. Sitemap order. */
export const LOCALIZED_PATHS = PAGES.map((p) => p[DEFAULT_URL_LANGUAGE]) as readonly string[];

export type LocalizedPath = (typeof PAGES)[number][typeof DEFAULT_URL_LANGUAGE];

function isUrlLanguage(value: string): value is UrlLanguage {
  return (URL_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Split a pathname into its language and the page id within that language.
 *
 * `/en/try`                          -> { lang: 'en', path: '/try' }
 * `/en/how-to-write-an-ats-friendly-cv` -> { lang: 'en', path: '/ats-uyumlu-cv-nasil-hazirlanir' }
 * `/try`                             -> { lang: 'tr', path: '/try' }
 * `/en`                              -> { lang: 'en', path: '/' }
 *
 * The returned `path` is always the page id, so callers compare against one
 * value regardless of which language's slug arrived.
 */
export function splitLangPath(pathname: string): { lang: UrlLanguage; path: string } {
  // Trailing slashes are normalised away by vercel.json, but a pathname can
  // still arrive with one from a hand-typed URL or a test.
  const clean = pathname.replace(/\/+$/, '') || '/';
  const [, first = '', ...rest] = clean.split('/');

  const prefixed = isUrlLanguage(first) && first !== DEFAULT_URL_LANGUAGE;
  const lang: UrlLanguage = prefixed ? (first as UrlLanguage) : DEFAULT_URL_LANGUAGE;
  const slug = prefixed ? `/${rest.join('/')}`.replace(/\/$/, '') || '/' : clean;

  const page = PAGES.find((p) => p[lang] === slug);
  return { lang, path: page ? page[DEFAULT_URL_LANGUAGE] : slug };
}

/** The slug `path` uses in `lang`, without the language prefix. */
export function routeSlug(path: string, lang: UrlLanguage): string {
  const page = PAGES.find((p) => p[DEFAULT_URL_LANGUAGE] === path);
  return page ? page[lang] : path;
}

/** The URL for page `path` in `lang`. `('/try', 'en')` -> `/en/try`. */
export function localizedPath(path: string, lang: UrlLanguage): string {
  const slug = routeSlug(path, lang);
  const base = slug === '/' ? '' : slug;
  return lang === DEFAULT_URL_LANGUAGE ? base || '/' : `/${lang}${base}`;
}

/** Absolute URL, for canonical and hreflang tags. */
export function localizedUrl(path: string, lang: UrlLanguage): string {
  const p = localizedPath(path, lang);
  return `${SITE}${p === '/' ? '/' : p}`;
}

/** True when this page id is translated into every URL language. */
export function isLocalizedPath(path: string): path is LocalizedPath {
  return LOCALIZED_PATHS.includes(path);
}
