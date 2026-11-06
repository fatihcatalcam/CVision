import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { routesFor, turkishOnlyRoutes, guideFaqJsonLd, sitemapXml, buildPage } from './prerender';
import { ATS_CV_HOWTO } from '../src/content/atsCvHowTo';
import { COVER_LETTER_PAGE, COVER_LETTER_EXAMPLES } from '../src/content/coverLetterExamples';
import tr from '../src/i18n/tr';

/**
 * The pages written for Turkish search: the sample CV and FAQ on the ATS CV
 * guide, and the Turkish-only cover letter examples.
 *
 * Every check runs against the prerendered HTML, which is what a crawler that
 * does not run JavaScript reads - Bing, and most AI crawlers.
 */

const ROOT = path.resolve(__dirname, '..');
const template = () => fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/** Text a crawler reads with no JavaScript: tags stripped, entities decoded. */
const visibleText = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<br>/g, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/** Every FAQPage block in a built page's <head>, parsed. */
const faqBlocks = (html: string) =>
  [...html.slice(0, html.indexOf('</head>')).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1]))
    .filter((j) => j['@type'] === 'FAQPage');

describe('ATS CV guide: sample CV and FAQ', () => {
  const guideTr = () => routesFor('tr').find((r) => r.path === '/ats-uyumlu-cv-nasil-hazirlanir')!;

  it('keeps "ATS uyumlu CV" in the H1 and the opening paragraph', () => {
    expect(tr.atsCvHowTo.title).toMatch(/^ATS uyumlu CV/);
    expect(tr.atsCvHowTo.definition).toMatch(/^ATS uyumlu bir CV/);
  });

  it('shows the sample CV as text in the static HTML, every line of it', () => {
    const text = visibleText(buildPage(template(), guideTr(), 'tr'));
    const sample = ATS_CV_HOWTO.tr!.flatMap((s) => s.items ?? []).find((i) => i.example)!;

    expect(text).toContain('ATS uyumlu CV örneği');
    for (const line of sample.example!.split('\n').filter(Boolean)) {
      expect(text, line).toContain(line);
    }
  });

  it('labels the sample person as invented', () => {
    const section = ATS_CV_HOWTO.tr!.find((s) => s.heading === 'ATS uyumlu CV örneği')!;
    expect(section.intro).toMatch(/uydurma/);
    expect(section.items![0].example).toMatch(/^ÖRNEK ADAY/);
  });

  it('marks up exactly the questions the page shows, and no others', () => {
    const html = buildPage(template(), guideTr(), 'tr');
    const [faq, ...extra] = faqBlocks(html);
    expect(extra).toEqual([]);

    const shown = ATS_CV_HOWTO.tr!.filter((s) => s.faq).flatMap((s) => s.items ?? []);
    expect(shown.length).toBeGreaterThanOrEqual(5);
    expect(faq.mainEntity.map((q: { name: string }) => q.name)).toEqual(shown.map((q) => q.title));

    const text = visibleText(html);
    for (const q of faq.mainEntity) {
      expect(text).toContain(q.name);
      expect(text).toContain(q.acceptedAnswer.text);
    }
  });

  it('adds no FAQ markup to the English guide, which shows no FAQ', () => {
    expect(guideFaqJsonLd('/ats-uyumlu-cv-nasil-hazirlanir', 'en')).toBeNull();
  });
});

describe('cover letter examples (Turkish only)', () => {
  const route = () => turkishOnlyRoutes().find((r) => r.path === '/on-yazi-ornekleri')!;
  const built = () => buildPage(template(), route(), 'tr');
  const letters = () => COVER_LETTER_EXAMPLES.find((s) => s.heading === '6 ön yazı örneği')!.items!;
  const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

  it('has its own title, description and canonical', () => {
    const html = built();
    expect(html).toContain('<title>Ön Yazı Örnekleri: İş Başvurusu İçin 6 Hazır Örnek | CVision</title>');
    expect(html).toContain(`<meta name="description" content="${COVER_LETTER_PAGE.metaDescription}" />`);
    expect(html).toContain('<link rel="canonical" href="https://www.cvisionapp.com/on-yazi-ornekleri" />');
    expect(html).toContain('<html lang="tr"');
  });

  it('declares no hreflang, in the page or the sitemap, because there is no translation', () => {
    expect(built()).not.toMatch(/<link rel="alternate" hreflang/);

    const xml = sitemapXml();
    const entry = /<url>\s*<loc>https:\/\/www\.cvisionapp\.com\/on-yazi-ornekleri<\/loc>[\s\S]*?<\/url>/.exec(xml);
    expect(entry).not.toBeNull();
    expect(entry![0]).not.toContain('hreflang');
    expect(entry![0]).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
    expect(xml).not.toContain('/en/on-yazi-ornekleri');
  });

  it('shows every example in the static HTML', () => {
    const text = visibleText(built());
    for (const section of COVER_LETTER_EXAMPLES) {
      expect(text).toContain(section.heading);
      for (const item of section.items ?? []) {
        expect(text).toContain(item.title);
        for (const line of (item.example ?? '').split('\n').filter(Boolean)) {
          expect(text, line).toContain(line);
        }
      }
    }
    expect(text).toContain(COVER_LETTER_PAGE.ctaTitle);
  });

  it('has the six letters asked for, each 120-180 words', () => {
    expect(letters().map((l) => l.title)).toEqual([
      'Yeni mezun ön yazı örneği',
      'Satış ön yazı örneği',
      'Muhasebe ön yazı örneği',
      'Yazılım geliştirici ön yazı örneği',
      'Müşteri hizmetleri ön yazı örneği',
      'Staj başvurusu ön yazı örneği',
    ]);
    for (const letter of letters()) {
      const n = words(letter.example!);
      expect(n, `${letter.title}: ${n} words`).toBeGreaterThanOrEqual(120);
      expect(n, `${letter.title}: ${n} words`).toBeLessThanOrEqual(180);
    }
  });

  it('has two short examples of two or three sentences for job-site forms', () => {
    const short = COVER_LETTER_EXAMPLES.find((s) => s.heading.startsWith('Kariyer.net'))!.items!;
    expect(short).toHaveLength(2);
    for (const item of short) {
      const sentences = item.example!.split(/[.!?](?:\s|$)/).filter((s) => s.trim()).length;
      expect(sentences, item.title).toBeGreaterThanOrEqual(2);
      expect(sentences, item.title).toBeLessThanOrEqual(3);
    }
  });

  it('puts no invented percentages in the letters', () => {
    for (const letter of letters()) {
      expect(letter.example, letter.title).not.toMatch(/%\s?\d|\d\s?%/);
    }
  });

  it('is an Article in Turkish, with dates', () => {
    const html = built();
    const head = html.slice(0, html.indexOf('</head>'));
    const match = /<script type="application\/ld\+json" data-page="cover-letter-examples">([\s\S]*?)<\/script>/.exec(head);
    expect(match).not.toBeNull();
    const article = JSON.parse(match![1]);
    expect(article.inLanguage).toBe('tr');
    expect(article.headline).toBe(COVER_LETTER_PAGE.title);
    expect(article.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('is linked from the Turkish pages and never from the English ones', () => {
    const home = (lang: 'tr' | 'en') => buildPage(template(), routesFor(lang)[0], lang);
    expect(home('tr')).toContain('<a href="/on-yazi-ornekleri">');
    expect(home('en')).not.toContain('on-yazi-ornekleri');
  });
});

describe('homepage', () => {
  it('links to the ATS CV guide from the body, in each language tree', () => {
    expect(routesFor('tr')[0].body).toContain('<a href="/ats-uyumlu-cv-nasil-hazirlanir">');
    expect(routesFor('en')[0].body).toContain('<a href="/en/how-to-write-an-ats-friendly-cv">');
  });

  it('says CVision reads an existing CV rather than writing one', () => {
    expect(tr.home.hero.subtitle).toContain("CV'ni sıfırdan yazmaz; var olan CV'ni bir ATS gibi okur, puanlar");
  });
});

describe('/try in Turkish', () => {
  it('is titled as a free ATS CV check and says in its first paragraph what you get', () => {
    expect(tr.try.metaTitle).toMatch(/^Ücretsiz ATS CV Kontrolü/);
    expect(tr.try.sub).toMatch(/^Kayıt gerekmez/);
    expect(tr.try.sub).toContain('günde bir');
    expect(tr.try.sub).toContain('3 kredi');
  });
});

describe('Organization structured data', () => {
  it('names the official profile, so it is not confused with another CVision', () => {
    const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(template())![1];
    const org = JSON.parse(json)['@graph'].find((n: { '@type': string }) => n['@type'] === 'Organization');
    expect(org.name).toBe('CVision');
    expect(org.url).toBe('https://www.cvisionapp.com');
    expect(org.logo).toBe('https://www.cvisionapp.com/logo.png');
    expect(org.sameAs).toContain('https://www.linkedin.com/company/cvisionapp/');
    expect(fs.existsSync(path.join(ROOT, 'public/logo.png'))).toBe(true);
  });
});
