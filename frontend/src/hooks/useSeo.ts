import { useEffect } from 'react';

interface SeoOptions {
  /** Document title. Falls back to the static index.html title if omitted. */
  title?: string;
  /** Meta description. Updates the existing tag or creates one. */
  description?: string;
  /** Absolute canonical URL for this route. */
  canonical?: string;
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
 * Imperatively manage per-route SEO head tags for this client-rendered SPA.
 * Google executes JS and picks up these updates; this keeps the canonical and
 * title accurate as the user navigates between public routes.
 */
export function useSeo({ title, description, canonical }: SeoOptions) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) setMetaByName('description', description);
    if (canonical) setCanonical(canonical);
  }, [title, description, canonical]);
}
