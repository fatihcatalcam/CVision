import { useEffect } from 'react';
import {
  SITE,
  URL_LANGUAGES,
  DEFAULT_URL_LANGUAGE,
  isLocalizedPath,
  localizedUrl,
  splitLangPath,
} from '../i18n/routes';

interface SeoOptions {
  /** Document title. Falls back to the static index.html title if omitted. */
  title?: string;
  /** Meta description. Updates the existing tag or creates one. */
  description?: string;
  /**
   * Absolute canonical URL. Omit it: the default is derived from the current
   * pathname, which is the only version that survives a second language tree.
   * Every page used to hard-code its own string - `.../try` on TryPage - and
   * those strings are wrong the moment the same component renders at /en/try,
   * where they would tell Google the English page is a duplicate of the Turkish
   * one. Pass it only for a page that genuinely canonicalises elsewhere.
   */
  canonical?: string;
  /**
   * Keep this route out of the index. Needed for the 404 page: Vercel rewrites
   * every unknown path to index.html, so a missing page answers HTTP 200 and
   * Google reads it as a soft 404. `noindex` is what actually tells it not to.
   *
   * Removed again on unmount, which is the whole reason it lives here. A tag
   * left behind after navigating away would de-index a real page - worse than
   * the problem it was added to fix.
   */
  noindex?: boolean;
}

function setMetaByName(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  // Reuse the single canonical link from index.html (or create one), so each
  // route advertises exactly one canonical instead of stacking duplicates.
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Point hreflang at this path's translations, or clear it if it has none.
 *
 * Clearing matters as much as setting. These tags are static in the
 * prerendered HTML, so navigating from /try (translated) to /dashboard
 * (not translated) inside the SPA would otherwise leave /try's alternates
 * advertised on a page they do not describe.
 */
function setAlternates(path: string) {
  for (const el of document.head.querySelectorAll('link[rel="alternate"][hreflang]')) {
    el.remove();
  }
  if (!isLocalizedPath(path)) return;

  const add = (hreflang: string, href: string) => {
    const el = document.createElement('link');
    el.setAttribute('rel', 'alternate');
    el.setAttribute('hreflang', hreflang);
    el.setAttribute('href', href);
    document.head.appendChild(el);
  };

  for (const lang of URL_LANGUAGES) add(lang, localizedUrl(path, lang));
  // x-default is what a visitor gets when no declared language matches theirs.
  add('x-default', localizedUrl(path, DEFAULT_URL_LANGUAGE));
}

/**
 * Imperatively manage per-route SEO head tags for this client-rendered SPA.
 * Google executes JS and picks up these updates; this keeps the canonical and
 * title accurate as the user navigates between public routes.
 */
export function useSeo({ title, description, canonical, noindex }: SeoOptions) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) setMetaByName('description', description);

    const { path } = splitLangPath(window.location.pathname);
    setCanonical(canonical ?? `${SITE}${window.location.pathname.replace(/\/+$/, '') || '/'}`);
    setAlternates(path);
  }, [title, description, canonical]);

  // Separate effect with a cleanup, because this one has to be undone.
  //
  // It RESTORES rather than removes. index.html ships a site-wide
  // `<meta name="robots" content="index, follow">`, so deleting the tag on the
  // way out would strip a deliberate directive from every page the visitor
  // sees next in the same SPA session. Snapshot what was there, put it back.
  useEffect(() => {
    if (!noindex) return;

    const existing = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previous = existing?.getAttribute('content') ?? null;

    setMetaByName('robots', 'noindex, nofollow');

    return () => {
      const el = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
      if (!el) return;
      if (previous === null) el.remove();          // nothing here before us
      else el.setAttribute('content', previous);   // hand it back unchanged
    };
  }, [noindex]);
}
