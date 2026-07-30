/**
 * Build-time prerendering for the public marketing routes.
 *
 * The app is a client-rendered SPA: every URL is served the same index.html,
 * whose <title> and <meta description> describe the HOMEPAGE, with an empty
 * <div id="root">. Search Console (3 months) showed the cost - Google could not
 * tell the routes apart, and every single ranking query was the brand name.
 * The /how-ats-works guide, written specifically to rank, had zero impressions.
 *
 * This emits dist/<route>/index.html per route with that route's real title,
 * description, canonical, social tags and body copy. Vercel serves static files
 * before applying the SPA rewrite in vercel.json, so a crawler hitting
 * /how-ats-works gets the real page instead of the homepage shell. React then
 * mounts over it as usual (createRoot replaces the container, so there is no
 * hydration mismatch to manage).
 *
 * Copy comes from the SAME i18n resource the React components render, so the
 * static HTML can never drift from what users see. Turkish is prerendered
 * because it is the target market (~80% of traffic; position 1.67 in Turkey);
 * other languages still switch client-side after mount.
 */

import fs from 'node:fs';
import path from 'node:path';
import tr from '../src/i18n/tr';

const SITE = 'https://www.cvisionapp.com';
const DIST = path.resolve(process.cwd(), 'dist');

type Route = {
  /** URL path, also the output directory under dist/. */
  path: string;
  title: string;
  description: string;
  /** Body copy rendered into #root for crawlers. */
  body: string;
};

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const h1 = (s: string) => `<h1>${esc(s)}</h1>`;
const h2 = (s: string) => `<h2>${esc(s)}</h2>`;
const p = (s: string) => `<p>${esc(s)}</p>`;

/** The ATS guide: title, definition, then six heading/body sections. */
function guideBody(): string {
  const g = tr.howAts as Record<string, string>;
  const sections = [1, 2, 3, 4, 5, 6]
    .map((i) => h2(g[`s${i}Heading`]) + p(g[`s${i}Body`]))
    .join('');
  return h1(g.title) + p(g.definition) + sections + h2(g.ctaTitle);
}

function aboutBody(): string {
  const a = tr.about as Record<string, unknown>;
  const parts = [h1(String(a.title))];
  // The About page stores its prose under numbered/limited keys; take every
  // string value that is not meta so the crawler sees the real copy.
  for (const [key, value] of Object.entries(a)) {
    if (key.startsWith('meta') || key === 'title') continue;
    if (typeof value === 'string' && value.length > 40) parts.push(p(value));
  }
  return parts.join('');
}

function tryBody(): string {
  const t = tr.try as Record<string, unknown>;
  const seo = (t.seo ?? {}) as Record<string, string>;
  const parts = [h1(String(t.heading)), p(String(t.sub))];
  // SEO copy block (added so this page has something to rank on - it was
  // otherwise almost pure UI chrome). Optional: absent until the keys exist.
  if (seo.h2a) parts.push(h2(seo.h2a), p(seo.p1), p(seo.p2));
  if (seo.h2b) parts.push(h2(seo.h2b), p(seo.p3), p(seo.p4));
  if (seo.h2c) parts.push(h2(seo.h2c), p(seo.p5));
  return parts.join('');
}

const ROUTES: Route[] = [
  {
    path: '/how-ats-works',
    title: tr.howAts.metaTitle,
    description: tr.howAts.metaDescription,
    body: guideBody(),
  },
  {
    path: '/try',
    title: tr.try.metaTitle,
    description: tr.try.metaDescription,
    body: tryBody(),
  },
  {
    path: '/about',
    title: tr.about.metaTitle,
    description: tr.about.metaDescription,
    body: aboutBody(),
  },
];

/** Replace the first match of `re`, failing loudly if the template changed. */
function replaceOnce(html: string, re: RegExp, next: string, label: string): string {
  if (!re.test(html)) {
    throw new Error(
      `prerender: could not find ${label} in dist/index.html - the template ` +
        `changed and prerendered pages would silently keep the homepage value.`,
    );
  }
  return html.replace(re, next);
}

function buildPage(template: string, route: Route): string {
  const url = `${SITE}${route.path}`;
  let html = template;

  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(route.title)}</title>`, '<title>');
  html = replaceOnce(
    html,
    /<meta name="description" content="[\s\S]*?"\s*\/?>/,
    `<meta name="description" content="${esc(route.description)}" />`,
    'meta description',
  );
  html = replaceOnce(
    html,
    /<link rel="canonical" href="[\s\S]*?"\s*\/?>/,
    `<link rel="canonical" href="${url}" />`,
    'canonical',
  );

  // Social tags: keep them consistent with the page, but do not fail the build
  // if the template ever drops them.
  html = html
    .replace(/<meta property="og:title" content="[\s\S]*?"\s*\/?>/, `<meta property="og:title" content="${esc(route.title)}" />`)
    .replace(/<meta property="og:description" content="[\s\S]*?"\s*\/?>/, `<meta property="og:description" content="${esc(route.description)}" />`)
    .replace(/<meta property="og:url" content="[\s\S]*?"\s*\/?>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta name="twitter:title" content="[\s\S]*?"\s*\/?>/, `<meta name="twitter:title" content="${esc(route.title)}" />`)
    .replace(/<meta name="twitter:description" content="[\s\S]*?"\s*\/?>/, `<meta name="twitter:description" content="${esc(route.description)}" />`);

  html = replaceOnce(
    html,
    /<div id="root"><\/div>/,
    `<div id="root">${route.body}</div>`,
    '#root container',
  );

  return html;
}

function main() {
  const templatePath = path.join(DIST, 'index.html');
  if (!fs.existsSync(templatePath)) {
    throw new Error('prerender: dist/index.html missing - run vite build first.');
  }
  const template = fs.readFileSync(templatePath, 'utf8');

  for (const route of ROUTES) {
    const outDir = path.join(DIST, route.path.replace(/^\//, ''));
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), buildPage(template, route), 'utf8');
    console.log(`prerendered ${route.path} -> ${path.relative(DIST, outDir)}/index.html`);
  }
  console.log(`prerender: ${ROUTES.length} routes written`);
}

main();
