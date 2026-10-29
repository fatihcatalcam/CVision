import { DEVELOPER_SITE, FOUNDER_NAME } from '../constants/developer';
import { SITE } from '../i18n/routes';

/**
 * Article structured data for the long-form guides.
 *
 * Built in one place for both callers: the prerender writes it into each
 * guide's static <head>, which is what crawlers that do not run JS read, and
 * ArticlePage adds it on client-side navigation, where no prerendered copy is
 * on the page. The author is the person who wrote the guides, linked to the
 * same Person the site-wide graph in index.html names as founder.
 */
export function articleSchema(a: {
  headline: string;
  description: string;
  url: string;
  lang: string;
  /** ISO dates. Only the prerender knows them; the client copy goes without. */
  published?: string;
  modified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.headline,
    description: a.description,
    inLanguage: a.lang,
    url: a.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': a.url },
    ...(a.published && { datePublished: a.published }),
    ...(a.modified && { dateModified: a.modified }),
    author: { '@type': 'Person', '@id': `${SITE}/#founder`, name: FOUNDER_NAME, url: DEVELOPER_SITE },
    publisher: { '@id': `${SITE}/#organization` },
  };
}
