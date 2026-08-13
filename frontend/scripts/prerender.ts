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
 * description, canonical, social tags and body copy, plus the homepage's own
 * copy into dist/index.html. The homepage was the one page left out of the
 * first pass, so the site's most-linked URL kept serving an empty <div
 * id="root"> - no H1, no text - to every crawler that asked for it.
 *
 * Vercel serves static files before applying the SPA rewrite in vercel.json, so
 * a crawler hitting /how-ats-works gets the real page instead of the homepage
 * shell. React then mounts over it as usual (createRoot replaces the container,
 * so there is no hydration mismatch to manage).
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

/**
 * Styling for the pre-mount state.
 *
 * The app stylesheet is render-blocking and ~13KB; the JS bundle React needs is
 * ~189KB. So the browser paints this markup roughly 120ms before React replaces
 * it on desktop, and a second or more on slow mobile. Unstyled that reads as a
 * broken wall of text, because Tailwind's preflight strips heading sizes.
 *
 * Both the <style> and the content live INSIDE #root, so createRoot wipes them
 * together when React mounts and nothing can leak into the real app. Selectors
 * are scoped to #prerender anyway - a <style> in the body is global while it
 * exists. Colours come from the app's own variables so dark mode is inherited.
 */
const PRERENDER_STYLE =
  '<style>' +
  '#prerender{max-width:44rem;margin:0 auto;padding:3.5rem 1.5rem;color:var(--color-foreground)}' +
  '#prerender h1{font-size:2rem;line-height:1.25;font-weight:700;margin:0 0 1rem}' +
  '#prerender h2{font-size:1.35rem;line-height:1.3;font-weight:600;margin:2.5rem 0 .75rem}' +
  '#prerender h3{font-size:1.05rem;line-height:1.4;font-weight:600;margin:1.5rem 0 .35rem}' +
  '#prerender p{margin:0 0 1rem;line-height:1.65;color:var(--color-muted)}' +
  '#prerender nav{display:block;margin:2.5rem 0 0;font-size:.85rem;color:var(--color-muted)}' +
  '#prerender nav a{color:inherit;text-decoration:none}' +
  '</style>';

/**
 * The public routes, as real links, in the pre-mount markup.
 *
 * The rendered app has these in its footer, so Google finds them either way.
 * Bing and most AI crawlers do not execute JS, and for them the prerendered
 * body was a wall of prose with no outbound links at all - every page an
 * island. These are the same destinations the footer offers, nothing extra.
 */
const NAV_LINKS: [string, string][] = [
  ['/', 'CVision'],
  ['/try', tr.home.nav.tryFree],
  ['/how-ats-works', tr.home.nav.howAts],
  ['/pricing', tr.packs.title],
  ['/about', tr.home.nav.about],
  ['/privacy', tr.common.privacy],
  ['/terms', tr.common.terms],
];

/** Everything that goes inside <div id="root"> for a prerendered page. */
const shell = (body: string, self: string) => {
  const nav = NAV_LINKS.filter(([href]) => href !== self)
    .map(([href, label]) => `<a href="${href}">${esc(label)}</a>`)
    .join(' · ');
  return `${PRERENDER_STYLE}<div id="prerender">${body}<nav>${nav}</nav></div>`;
};

const h1 = (s: string) => `<h1>${esc(s)}</h1>`;
const h2 = (s: string) => `<h2>${esc(s)}</h2>`;
const h3 = (s: string) => `<h3>${esc(s)}</h3>`;
const p = (s: string) => `<p>${esc(s)}</p>`;

/** The homepage: hero, how-it-works, features, and the full FAQ. */
function homeBody(): string {
  const h = tr.home;
  const parts = [h1(h.hero.title), p(h.hero.subtitle)];

  const steps = h.howItWorks as Record<string, string>;
  parts.push(h2(steps.label));
  for (const i of [1, 2, 3]) {
    parts.push(h3(steps[`step${i}Title`]), p(steps[`step${i}Desc`]));
  }

  const features = h.features as Record<string, string>;
  parts.push(h2(features.label));
  for (const key of ['scoring', 'career', 'skills']) {
    parts.push(h3(features[`${key}Title`]), p(features[`${key}Desc`]));
  }

  // The FAQ matters most here: the template already ships a FAQPage JSON-LD
  // block with these exact answers, but the visible copy backing it only
  // existed after React mounted. Crawlers that check the markup against the
  // rendered page saw structured data with nothing behind it.
  const faq = h.faq as Record<string, string>;
  parts.push(h2(faq.label));
  for (let i = 1; faq[`q${i}`]; i++) {
    parts.push(h3(faq[`q${i}`]), p(faq[`a${i}`]));
  }

  return parts.join('');
}

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

/**
 * The legal pages, walked generically.
 *
 * Both blocks are flat maps of `s1Heading`/`s1Body`/`s2AccountTitle`/... in
 * document order, so the key suffix is enough to pick the tag and no per-page
 * list has to be maintained alongside the copy. They were the two URLs in the
 * sitemap that were never prerendered: a crawler asking for /privacy got the
 * homepage's title, H1 and canonical="/" - the sitemap pointing at a page that
 * then declared itself a duplicate of the homepage.
 */
function legalBody(block: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(block)) {
    if (typeof value !== 'string') continue;
    if (key.startsWith('meta')) continue;
    if (key === 'title') parts.push(h1(value));
    else if (key.endsWith('Heading')) parts.push(h2(value));
    else if (key.endsWith('Title') || key.endsWith('Name')) parts.push(h3(value));
    else parts.push(p(value));
  }
  return parts.join('');
}

/**
 * A meta description taken from the page's own opening paragraph.
 *
 * Deliberately derived rather than hand-written: these are priority-0.3 legal
 * pages, and a description copied by hand is one more string to keep in sync
 * with the text above it in five locales.
 */
function summarize(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

/**
 * The pricing page.
 *
 * The pack cards are fetched from Lemon Squeezy after mount, so there is
 * nothing in them for a crawler; packs.seo is the copy that carries the page.
 * PricingPage renders the same block, which is the rule for everything here -
 * prerendered text that the mounted app does not also show is text Google
 * discards when it renders the page for real.
 */
function pricingBody(): string {
  const k = tr.packs as Record<string, unknown>;
  const seo = k.seo as Record<string, string>;
  return [
    h1(String(k.title)),
    p(String(k.subtitle)),
    h2(seo.h2a), p(seo.p1), p(seo.p2),
    h2(seo.h2b), p(seo.p3),
    p(String(k.freeRoutes)),
  ].join('');
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
  {
    path: '/pricing',
    title: tr.settings.pricing.metaTitle,
    description: tr.settings.pricing.metaDescription,
    body: pricingBody(),
  },
  // Titles here must match what PrivacyPage/TermsPage hand to useSeo, or the
  // tab title would visibly change the moment React mounts.
  {
    path: '/privacy',
    title: `${tr.legal.privacy.title} - CVision`,
    description: summarize(tr.legal.privacy.s1Body),
    body: legalBody(tr.legal.privacy),
  },
  {
    path: '/terms',
    title: `${tr.legal.terms.title} - CVision`,
    description: summarize(tr.legal.terms.s1Body),
    body: legalBody(tr.legal.terms),
  },
];

/**
 * FAQPage structured data, built from the SAME strings the homepage renders.
 *
 * It used to be a hand-maintained block in index.html, which is the template
 * every route here is built from - so all ten questions shipped on /try,
 * /about, /how-ats-works and every SPA-fallback URL, none of which show a FAQ.
 * Google asks that FAQ markup match the visible page; that was unbacked markup
 * on every URL on the site. The hand-kept copy had also drifted twice over:
 * written in English for a page that renders in Turkish, and still quoting the
 * retired monthly subscription months after the move to credits.
 *
 * Generating it from tr.home.faq means it is injected on the homepage alone and
 * is, by construction, exactly what a visitor reads there.
 */
function faqJsonLd(): string {
  const faq = tr.home.faq as Record<string, string>;
  const mainEntity = [];
  for (let i = 1; faq[`q${i}`]; i++) {
    mainEntity.push({
      '@type': 'Question',
      name: faq[`q${i}`],
      acceptedAnswer: { '@type': 'Answer', text: faq[`a${i}`] },
    });
  }
  if (!mainEntity.length) {
    throw new Error('prerender: no FAQ questions found in tr.home.faq');
  }
  // Escaping "<" keeps a stray "</script>" in the copy from closing this tag.
  const json = JSON.stringify(
    { '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: 'tr', mainEntity },
    null,
    2,
  ).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

/**
 * `String.replace` with a LITERAL replacement.
 *
 * Everything substituted here is i18n copy, and a bare `html.replace(re, next)`
 * reads `$&`, `$1` and friends inside `next` as backreferences. One "$&" in a
 * Turkish sentence would silently splice the matched tag into the page.
 */
const sub = (html: string, re: RegExp, next: string) => html.replace(re, () => next);

/** Replace the first match of `re`, failing loudly if the template changed. */
function replaceOnce(html: string, re: RegExp, next: string, label: string): string {
  if (!re.test(html)) {
    throw new Error(
      `prerender: could not find ${label} in dist/index.html - the template ` +
        `changed and prerendered pages would silently keep the homepage value.`,
    );
  }
  return sub(html, re, next);
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
  html = sub(html, /<meta property="og:title" content="[\s\S]*?"\s*\/?>/, `<meta property="og:title" content="${esc(route.title)}" />`);
  html = sub(html, /<meta property="og:description" content="[\s\S]*?"\s*\/?>/, `<meta property="og:description" content="${esc(route.description)}" />`);
  html = sub(html, /<meta property="og:url" content="[\s\S]*?"\s*\/?>/, `<meta property="og:url" content="${url}" />`);
  html = sub(html, /<meta name="twitter:title" content="[\s\S]*?"\s*\/?>/, `<meta name="twitter:title" content="${esc(route.title)}" />`);
  html = sub(html, /<meta name="twitter:description" content="[\s\S]*?"\s*\/?>/, `<meta name="twitter:description" content="${esc(route.description)}" />`);

  html = replaceOnce(
    html,
    /<div id="root"><\/div>/,
    `<div id="root">${shell(route.body, route.path)}</div>`,
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

  // The homepage is written LAST because its output file IS dist/index.html -
  // the template every page above was built from. Only the body is injected:
  // the <head> here already describes the homepage, hand-tuned down to the
  // keywords and JSON-LD, so running it through buildPage would be a downgrade.
  //
  // This is also the file vercel.json falls back to for every route that is not
  // prerendered, which is a second reason it has to hold the homepage's copy.
  // Being the fallback has a cost the three pages above do not pay: on /login,
  // /dashboard and friends this homepage copy would PAINT before React mounts,
  // because the app CSS is render-blocking and lands well before the JS bundle.
  // The inline script below runs synchronously during parse - before first
  // paint - and clears the copy off any route that is not the homepage, so
  // those routes keep their old blank-shell behaviour. Crawlers asking for /
  // are unaffected, which is the entire point of prerendering it.
  const guard =
    `<script>if(location.pathname!=='/')document.getElementById('root').textContent=''</script>`;

  let home = replaceOnce(
    template,
    /<div id="root"><\/div>/,
    `<div id="root">${shell(homeBody(), '/')}</div>${guard}`,
    'empty #root container (run vite build again if this file was already prerendered)',
  );

  // The FAQ schema goes in HERE and nowhere else. Adding it to index.html by
  // hand is what put it on every route in the first place, since that file is
  // the template above and the SPA fallback for everything not prerendered.
  home = replaceOnce(home, /<\/head>/, `${faqJsonLd()}\n  </head>`, '</head>');

  fs.writeFileSync(templatePath, home, 'utf8');
  console.log('prerendered / -> index.html (+ FAQPage JSON-LD)');
  console.log(`prerender: ${ROUTES.length + 1} routes written`);
}

// This module only DEFINES the build; prerender.run.ts is what executes it.
//
// Splitting them is what lets prerender.test.ts import ROUTES and faqJsonLd
// without writing into dist/ as a side effect of the import. The first attempt
// guarded `main()` with a process.argv check instead, which silently made the
// whole step a no-op: under `vite-node scripts/prerender.ts`, argv[1] is
// vite-node.mjs, not the script, so the build passed and shipped a site with
// no prerendering at all. An entry point cannot be got wrong that way.
export { ROUTES, faqJsonLd, main };
