import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ROUTES, faqJsonLd } from './prerender';
import tr from '../src/i18n/tr';

/**
 * Guards on the build step, not the app.
 *
 * Two bugs lived here at once and neither could fail a test, because there were
 * no tests: index.html is both the template every prerendered route is built
 * from AND the SPA fallback, so anything hand-added to its <head> silently
 * shipped on every URL on the site. That is how the homepage's ten-question
 * FAQPage block ended up on /try, /about, /how-ats-works and every unknown
 * path, none of which display a FAQ. Meanwhile /privacy and /terms sat in
 * sitemap.xml without being prerendered at all, so a crawler asking for them
 * got the homepage's title, H1 and canonical="/".
 *
 * Both are invariants about files, so they are checked against the files.
 */

const ROOT = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

describe('index.html template', () => {
  it('carries no FAQPage schema of its own', () => {
    // The whole point: this file is copied into every route. A FAQ block here
    // is a FAQ block everywhere, which is exactly what Google asks you not to
    // do - the markup has to match the page a visitor actually sees.
    expect(read('index.html')).not.toContain('"@type": "FAQPage"');
  });

  it('states the same title and description as tr.ts', () => {
    // The homepage head is NOT rewritten by buildPage - this file is the
    // homepage. useSeo then overwrites both from tr.ts on mount, so a drift
    // here is a title that visibly changes as the page loads.
    const html = read('index.html');
    expect(html).toContain(`<title>${tr.home.metaTitle}</title>`);
    expect(html).toContain(`content="${tr.home.metaDescription}"`);
  });
});

describe('the build actually runs the prerender step', () => {
  it('invokes the entry point that calls main()', () => {
    // Learned the hard way, in this same change: guarding main() behind a
    // process.argv check turned the whole step into a no-op under vite-node,
    // and the build still exited 0. Every page shipped as an empty shell and
    // nothing anywhere said so. The entry point is now a real file, and this
    // asserts the build still points at it.
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.scripts.build).toContain('scripts/prerender.run.ts');
  });

  it('has an entry point whose only job is to call main()', () => {
    expect(read('scripts/prerender.run.ts')).toContain('main()');
  });
});

describe('vercel.json', () => {
  // Vercel validates this file against a closed schema and REJECTS the whole
  // deploy on an unknown key. A "//" key added as a comment - JSON has none -
  // failed the build, so a batch of SEO fixes sat unshipped while the live site
  // still served every old value. Nothing local caught it: the file is valid
  // JSON and no test read it.
  const ALLOWED = new Set([
    'buildCommand', 'cleanUrls', 'crons', 'devCommand', 'framework', 'functions',
    'git', 'github', 'headers', 'images', 'ignoreCommand', 'installCommand',
    'outputDirectory', 'public', 'redirects', 'regions', 'rewrites',
    'trailingSlash',
  ]);

  it('uses only keys Vercel accepts', () => {
    const config = JSON.parse(read('vercel.json'));
    const unknown = Object.keys(config).filter((k) => !ALLOWED.has(k));

    expect(
      unknown,
      `Vercel rejects the deploy on unknown top-level keys. JSON has no ` +
        `comments - put the explanation in the commit message: ${unknown.join(', ')}`,
    ).toEqual([]);
  });

  it('normalises trailing slashes', () => {
    // /try/ and /try both answered 200 with no redirect, which is two URLs for
    // one page as far as a crawler is concerned.
    expect(JSON.parse(read('vercel.json')).trailingSlash).toBe(false);
  });
});

describe('robots.txt', () => {
  const lines = () => read('public/robots.txt').split('\n').map((l) => l.trim());

  it('keeps the group contiguous, with no blank line among the rules', () => {
    // RFC 9309 - the spec Google wrote - lets blank lines sit inside a group.
    // The older 1994 draft ends the record at the first blank line, and the
    // parsers still following it (Python's stdlib robotparser among them) read
    // this file as having NO rules at all: the blank line after "User-agent: *"
    // discarded the group, and /dashboard, /hq-portal, /settings and /login
    // came back crawlable. Comments are safe in both dialects; blank lines are
    // not. Sitemap is a separate, group-independent directive and may follow a
    // blank line.
    const all = lines();
    const start = all.findIndex((l) => l.toLowerCase().startsWith('user-agent:'));
    const lastRule = all.reduce(
      (acc, l, i) => (/^(allow|disallow):/i.test(l) ? i : acc),
      -1,
    );

    expect(start, 'no user-agent line').toBeGreaterThanOrEqual(0);
    expect(lastRule, 'no allow/disallow rules').toBeGreaterThan(start);

    const blanks = all
      .slice(start, lastRule + 1)
      .map((l, i) => (l === '' ? start + i + 1 : 0))
      .filter(Boolean);

    expect(
      blanks,
      `blank line(s) inside the User-agent group at line(s) ${blanks.join(', ')}. ` +
        `Legacy parsers stop reading there and every rule below is lost. ` +
        `Use a # comment to break the file up instead.`,
    ).toEqual([]);
  });

  it('still blocks the private routes and allows the public ones', () => {
    const all = lines();
    for (const path of ['/dashboard', '/hq-portal', '/settings', '/login', '/analysis/']) {
      expect(all, `${path} must stay out of the index`).toContain(`Disallow: ${path}`);
    }
    for (const path of ['/try', '/pricing', '/about', '/how-ats-works']) {
      expect(all, `${path} is public`).toContain(`Allow: ${path}`);
    }
    // The one that regressed: /pricing was Disallowed while it sat behind
    // ProtectedRoute, and making the page public means removing that too.
    expect(all).not.toContain('Disallow: /pricing');
  });

  it('points at the sitemap', () => {
    expect(read('public/robots.txt')).toContain(
      'Sitemap: https://www.cvisionapp.com/sitemap.xml',
    );
  });
});

describe('FAQ structured data', () => {
  it('is generated from the strings the homepage renders', () => {
    const json = faqJsonLd();
    const faq = tr.home.faq as Record<string, string>;

    expect(json).toContain('"@type": "FAQPage"');
    // Turkish, because the page it describes renders in Turkish. The old
    // hand-written block was English on a tr page.
    expect(json).toContain('"inLanguage": "tr"');
    expect(json).toContain(JSON.stringify(faq.q1).slice(1, -1));
  });

  it('covers every question on the page and invents none', () => {
    const faq = tr.home.faq as Record<string, string>;
    const asked = Object.keys(faq).filter((k) => /^q\d+$/.test(k)).length;
    const answered = (faqJsonLd().match(/"@type": "Question"/g) ?? []).length;

    expect(asked).toBeGreaterThan(0);
    expect(answered).toBe(asked);
  });

  it('quotes no price, so it cannot go stale the way the old block did', () => {
    // The retired ₺199.99/month subscription outlived the product by months in
    // three separate hand-kept copies, and that is what AI search engines were
    // still repeating back. Prices live in Lemon Squeezy; nothing here.
    expect(faqJsonLd()).not.toMatch(/199[.,]99/);
  });
});

describe('sitemap and prerendering agree', () => {
  it('prerenders every URL the sitemap advertises', () => {
    const sitemap = read('public/sitemap.xml');
    const paths = [...sitemap.matchAll(/<loc>https:\/\/www\.cvisionapp\.com(\/[^<]*)?<\/loc>/g)]
      .map((m) => m[1] ?? '/')
      .filter((p) => p !== '/'); // the homepage is written separately, in main()

    expect(paths.length).toBeGreaterThan(0);

    const prerendered = ROUTES.map((r) => r.path);
    const orphans = paths.filter((p) => !prerendered.includes(p));

    expect(
      orphans,
      `in sitemap.xml but never prerendered, so crawlers get the homepage ` +
        `shell and canonical="/" instead: ${orphans.join(', ')}`,
    ).toEqual([]);
  });

  it('gives every sitemap URL a lastmod', () => {
    // Google ignores changefreq and priority outright; lastmod is the only
    // field it reads, and it was missing from all six entries.
    const sitemap = read('public/sitemap.xml');
    const urls = (sitemap.match(/<url>/g) ?? []).length;
    const stamps = (sitemap.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) ?? []).length;

    expect(urls).toBeGreaterThan(0);
    expect(stamps).toBe(urls);
  });
});

describe('prerendered routes', () => {
  it('give each page its own title and description', () => {
    for (const route of ROUTES) {
      expect(route.title, `${route.path} title`).toBeTruthy();
      expect(route.description, `${route.path} description`).toBeTruthy();
      expect(route.title, `${route.path} still has the homepage title`)
        .not.toBe(tr.home.metaTitle);
    }
  });

  it('give each page real body copy for crawlers', () => {
    for (const route of ROUTES) {
      expect(route.body, `${route.path} body`).toContain('<h1>');
      expect(route.body.length, `${route.path} body length`).toBeGreaterThan(200);
    }
  });
});
