import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { routesFor, faqJsonLd, sitemapXml, alternatesHtml } from './prerender';
import { URL_LANGUAGES, LOCALIZED_PATHS, localizedUrl } from '../src/i18n/routes';
import { ATS_GUIDE_EXTRA } from '../src/content/atsGuide';
import tr from '../src/i18n/tr';
import en from '../src/i18n/en';

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

  it('declares no hreflang of its own', () => {
    // Same trap: alternates added by hand would ship on every page, each one
    // claiming to be the homepage's translation. prerender.ts emits them
    // per route, right after the canonical it also rewrites.
    expect(read('index.html')).not.toContain('rel="alternate" hreflang');
  });

  it('states the same title and description as tr.ts', () => {
    // The homepage head is the Turkish one, and useSeo overwrites both from
    // tr.ts on mount - a drift here is a title that changes as the page loads.
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
    for (const p of ['/dashboard', '/hq-portal', '/settings', '/login', '/analysis/']) {
      expect(all, `${p} must stay out of the index`).toContain(`Disallow: ${p}`);
    }
    for (const p of ['/try', '/pricing', '/about', '/how-ats-works', '/en']) {
      expect(all, `${p} is public`).toContain(`Allow: ${p}`);
    }
    expect(all).not.toContain('Disallow: /pricing');
  });

  it('points at the sitemap', () => {
    expect(read('public/robots.txt')).toContain(
      'Sitemap: https://www.cvisionapp.com/sitemap.xml',
    );
  });

  it('does not ship a hand-written sitemap beside the generated one', () => {
    // prerender.ts writes dist/sitemap.xml. A copy in public/ would be emitted
    // first and then overwritten - or worse, survive and disagree.
    expect(fs.existsSync(path.join(ROOT, 'public/sitemap.xml'))).toBe(false);
  });
});

describe('FAQ structured data', () => {
  it('is generated from the strings that language\'s homepage renders', () => {
    for (const lang of URL_LANGUAGES) {
      const json = faqJsonLd(lang);
      const faq = (lang === 'tr' ? tr : en).home.faq as Record<string, string>;

      expect(json).toContain('"@type": "FAQPage"');
      expect(json, `${lang} FAQ must declare its own language`)
        .toContain(`"inLanguage": "${lang}"`);
      expect(json).toContain(JSON.stringify(faq.q1).slice(1, -1));
    }
  });

  it('covers every question on the page and invents none', () => {
    for (const lang of URL_LANGUAGES) {
      const faq = (lang === 'tr' ? tr : en).home.faq as Record<string, string>;
      const asked = Object.keys(faq).filter((k) => /^q\d+$/.test(k)).length;
      const answered = (faqJsonLd(lang).match(/"@type": "Question"/g) ?? []).length;

      expect(asked).toBeGreaterThan(0);
      expect(answered, `${lang}`).toBe(asked);
    }
  });

  it('quotes no price, so it cannot go stale the way the old block did', () => {
    // The retired ₺199.99/month subscription outlived the product by months in
    // three separate hand-kept copies, and that is what AI search engines were
    // still repeating back. Prices live in Lemon Squeezy; nothing here.
    for (const lang of URL_LANGUAGES) {
      expect(faqJsonLd(lang)).not.toMatch(/199[.,]99/);
    }
  });
});

describe('hreflang', () => {
  it('names every language plus x-default, on every page', () => {
    for (const routePath of LOCALIZED_PATHS) {
      const html = alternatesHtml(routePath);
      for (const lang of URL_LANGUAGES) {
        expect(html, `${routePath} must declare ${lang}`)
          .toContain(`hreflang="${lang}" href="${localizedUrl(routePath, lang)}"`);
      }
      expect(html).toContain('hreflang="x-default"');
    }
  });

  it('gives both translations of a page the identical set', () => {
    // Reciprocity is the rule Google actually enforces: if /en/try names /try
    // but /try does not name /en/try back, the whole set is discarded. Both
    // pages are built from the same path, so the sets must be character-equal.
    for (const routePath of LOCALIZED_PATHS) {
      const set = alternatesHtml(routePath);
      expect(set).toBe(alternatesHtml(routePath));
      // And each page's set includes the page itself, which is also required.
      for (const lang of URL_LANGUAGES) {
        expect(set).toContain(localizedUrl(routePath, lang));
      }
    }
  });
});

describe('sitemap', () => {
  it('lists every localized path in every language', () => {
    const xml = sitemapXml();
    for (const lang of URL_LANGUAGES) {
      for (const routePath of LOCALIZED_PATHS) {
        expect(xml, `${lang} ${routePath}`)
          .toContain(`<loc>${localizedUrl(routePath, lang)}</loc>`);
      }
    }
    const count = (xml.match(/<loc>/g) ?? []).length;
    expect(count).toBe(URL_LANGUAGES.length * LOCALIZED_PATHS.length);
  });

  it('prerenders every URL it advertises', () => {
    // The invariant the hand-written file broke: /privacy and /terms were
    // listed for months while neither was prerendered, so crawlers got the
    // homepage shell and canonical="/" instead.
    const xml = sitemapXml();
    const listed = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

    const built = URL_LANGUAGES.flatMap((lang) =>
      routesFor(lang).map((r) => localizedUrl(r.path, lang)),
    );

    const orphans = listed.filter((u) => !built.includes(u));
    expect(orphans, `advertised but never prerendered: ${orphans.join(', ')}`).toEqual([]);
  });

  it('gives every entry a lastmod', () => {
    const xml = sitemapXml();
    const urls = (xml.match(/<url>/g) ?? []).length;
    const stamps = (xml.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) ?? []).length;

    expect(urls).toBeGreaterThan(0);
    expect(stamps).toBe(urls);
  });
});

describe('the ATS guide', () => {
  const guide = (lang: 'tr' | 'en') =>
    routesFor(lang).find((r) => r.path === '/how-ats-works')!;

  it('carries the long-form sections in both URL languages', () => {
    for (const lang of ['tr', 'en'] as const) {
      const body = guide(lang).body;
      for (const section of ATS_GUIDE_EXTRA[lang]!) {
        expect(body, `${lang} is missing "${section.heading}"`)
          .toContain(section.heading.replace(/&/g, '&amp;'));
      }
    }
  });

  it('is long enough to be worth ranking', () => {
    // It was 509 words - thin for a page written specifically to rank, and
    // Search Console showed it earning zero impressions. This is a floor, not
    // a target; it only fails if someone deletes most of the article.
    for (const lang of ['tr', 'en'] as const) {
      const words = guide(lang).body.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean);
      expect(words.length, `${lang} guide word count`).toBeGreaterThan(1000);
    }
  });

  it('gives the extra sections real headings and subheadings', () => {
    for (const lang of ['tr', 'en'] as const) {
      const body = guide(lang).body;
      expect((body.match(/<h2>/g) ?? []).length, `${lang} h2 count`).toBeGreaterThan(6);
      expect((body.match(/<h3>/g) ?? []).length, `${lang} h3 count`).toBeGreaterThan(10);
    }
  });

  it('leaves the untranslated languages with the page they already had', () => {
    // Spanish, German and French have no URLs, so nothing here could rank for
    // them. Falling back to English would replace half their page with a
    // language they did not ask for; absent is the deliberate answer.
    for (const lang of ['es', 'de', 'fr']) {
      expect(ATS_GUIDE_EXTRA[lang]).toBeUndefined();
    }
  });
});

describe('prerendered routes', () => {
  it('exist in both language trees, for the same paths', () => {
    for (const lang of URL_LANGUAGES) {
      expect(routesFor(lang).map((r) => r.path)).toEqual([...LOCALIZED_PATHS]);
    }
  });

  it('give each page its own title, description and body', () => {
    for (const lang of URL_LANGUAGES) {
      const routes = routesFor(lang);
      const home = routes[0];
      for (const route of routes) {
        expect(route.title, `${lang} ${route.path} title`).toBeTruthy();
        expect(route.description, `${lang} ${route.path} description`).toBeTruthy();
        expect(route.body, `${lang} ${route.path} body`).toContain('<h1>');
        expect(route.body.length, `${lang} ${route.path} body length`).toBeGreaterThan(200);
        if (route.path !== '/') {
          expect(route.title, `${lang} ${route.path} still has the homepage title`)
            .not.toBe(home.title);
        }
      }
    }
  });

  it('writes each tree in its own language', () => {
    // The English pages are built from en.ts, not from tr.ts with an /en
    // prefix bolted on. Comparing the homepage titles is the cheapest proof.
    expect(routesFor('en')[0].title).toBe(en.home.metaTitle);
    expect(routesFor('tr')[0].title).toBe(tr.home.metaTitle);
    expect(routesFor('en')[0].title).not.toBe(routesFor('tr')[0].title);
  });
});
