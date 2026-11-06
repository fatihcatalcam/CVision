import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { Button } from '../../components/ui/Button';
import { useSeo } from '../../hooks/useSeo';
import { useLocalizedNav } from '../../hooks/useLocalizedNav';
import { localizedUrl } from '../../i18n/routes';
import { exampleParagraphs, type GuideSection } from '../../content/atsGuide';
import { COVER_LETTER_PAGE } from '../../content/coverLetterExamples';
import { DeveloperCredit } from '../../components/ui/DeveloperCredit';
import { articleSchema } from '../../seo/articleSchema';

/**
 * The chrome and body layout shared by the long-form guides.
 *
 * Both are the same object: a header with a way home, one h1, a stack of
 * h2 sections, a CTA into /try and a footer. Extracted when the second guide
 * arrived rather than copying ninety lines of layout - and it means the
 * Article JSON-LD, the canonical and the language rule for the content are
 * decided once instead of per page.
 */

/** The page's own strings: what `ns` looks up in the i18n bundles. */
export type ArticleCopy = {
  metaTitle: string;
  metaDescription: string;
  back: string;
  title: string;
  ctaTitle: string;
  ctaButton: string;
  /** Small print under the call to action. */
  ctaNote?: string;
};

export type ArticlePageProps = {
  /** Page id from i18n/routes.ts, e.g. '/how-ats-works'. */
  path: string;
  /** i18n key prefix, e.g. 'howAts'. Expects metaTitle/metaDescription/back/title/ctaTitle/ctaButton. */
  ns?: string;
  /**
   * The same strings given directly, for a page in one language only. Its
   * copy cannot live in the i18n bundles, whose parity test wants every key
   * in all five languages.
   */
  copy?: ArticleCopy;
  /**
   * The one language the page is written in. Its sections then show whatever
   * the UI language is, instead of disappearing for everyone else.
   */
  contentLang?: string;
  /** Where the call to action goes: a page id or an app route. */
  ctaPath?: string;
  /** Value for the JSON-LD data-page attribute, so the tag is identifiable. */
  slug: string;
  /** Long-form sections by language. Absent for a language means none render. */
  content: Partial<Record<string, GuideSection[]>>;
  /** Rendered between the h1 and the long-form sections. */
  children?: ReactNode;
  /** Paragraph directly under the h1. */
  intro?: string;
};

/**
 * A worked example - a sample CV or letter - as text on the page.
 *
 * Paragraphs and line breaks come from the same exampleParagraphs() the
 * prerender uses, so the static HTML and the mounted page say the same thing.
 */
export function GuideExample({ text }: { text: string }) {
  return (
    <div className="mt-3 rounded-lg border border-[#EAEAEA] dark:border-white/[0.07] bg-white dark:bg-[#1c1c1a] px-5 py-4 space-y-3 text-sm leading-relaxed text-[#111111] dark:text-[#e8e7e4] break-words">
      {exampleParagraphs(text).map((lines, i) => (
        <p key={i}>
          {lines.map((line, j) => (
            <span key={j}>
              {j > 0 && <br />}
              {line}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

/** One long-form section: h2, optional intro, h3+body items, optional outro. */
export function GuideSections({ sections }: { sections: GuideSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="text-base font-bold uppercase tracking-wider text-[#6B6A65] dark:text-[#908d89]">
            {section.heading}
          </h2>
          {section.intro && (
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              {section.intro}
            </p>
          )}
          {section.items?.map((item) => (
            <div key={item.title} className="pt-2 space-y-1">
              <h3 className="text-sm font-bold text-[#111111] dark:text-[#e8e7e4]">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
                {item.body}
              </p>
              {item.example && <GuideExample text={item.example} />}
            </div>
          ))}
          {section.outro && (
            <p className="pt-2 text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              {section.outro}
            </p>
          )}
        </section>
      ))}
    </>
  );
}

export function ArticlePage({ path, ns, copy, contentLang, ctaPath = '/try', slug, content, children, intro }: ArticlePageProps) {
  const { t, i18n } = useTranslation();
  const { href, go, lang } = useLocalizedNav();

  const text: ArticleCopy = copy ?? {
    metaTitle: t(`${ns}.metaTitle`),
    metaDescription: t(`${ns}.metaDescription`),
    back: t(`${ns}.back`),
    title: t(`${ns}.title`),
    ctaTitle: t(`${ns}.ctaTitle`),
    ctaButton: t(`${ns}.ctaButton`),
  };

  // Derived from the tree, never hard-coded. A constant here would tell Google
  // the English page is a duplicate of the Turkish one - which is exactly what
  // the previous version of the ATS guide did at /en/how-ats-works.
  const canonical = localizedUrl(path, lang);

  useSeo({
    title: text.metaTitle,
    description: text.metaDescription,
  });

  // Keyed on the UI language, NOT the tree.
  //
  // The tree is only ever 'tr' or 'en', so keying on it served a visitor
  // reading the site in French a page of French headings above a thousand words
  // of Turkish. The languages without URLs of their own are promised the
  // shorter page they already had; only the UI language can keep that promise.
  // Under /en the boundary has already pinned the UI to English, so the two
  // agree there anyway.
  const uiLang = (i18n.language ?? '').split('-')[0];
  const sections = content[contentLang ?? uiLang] ?? [];

  // Article JSON-LD, injected per route and removed on unmount so it never
  // lingers on another page. A guide loaded directly already carries the
  // prerendered copy (with its dates) in <head>; adding a second would give
  // the page two Articles, so this only fills in after client-side navigation.
  useEffect(() => {
    if (document.head.querySelector(`script[data-page="${slug}"]`)) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-page', slug);
    script.textContent = JSON.stringify(articleSchema({
      headline: text.title,
      description: text.metaDescription,
      url: canonical,
      lang: document.documentElement.lang || 'en',
    }));
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [text.title, text.metaDescription, slug, canonical]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>

      <header className="sticky top-0 z-50 backdrop-blur-sm border-b border-[#EAEAEA] dark:border-white/[0.07]"
        style={{ background: 'color-mix(in srgb, var(--color-background) 95%, transparent)' }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <a
            href={href('/')}
            onClick={(e) => { e.preventDefault(); go('/'); }}
            className="flex items-center gap-1.5 text-sm text-[#6B6A65] dark:text-[#908d89] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {text.back}
          </a>
          <span className="text-sm font-bold text-[#111111] dark:text-[#e8e7e4]">CVision</span>
          <div className="flex items-center gap-1">
            {/* A page in one language has nothing to switch to. */}
            {!copy && <LanguageSwitcher />}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-14 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#111111] dark:text-[#e8e7e4] tracking-tight mb-6">
            {text.title}
          </h1>
          {intro && (
            /* The entity definition - the paragraph AI systems lift verbatim. */
            <p className="text-base leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              {intro}
            </p>
          )}
        </div>

        <div className="space-y-10">
          {children}
          {/* The same sections the prerender script emits. Static HTML that says
              more than the live page is text Google discards, and is the shape
              of cloaking. */}
          <GuideSections sections={sections} />
        </div>

        <div className="mt-14 pt-10 border-t border-[#EAEAEA] dark:border-white/[0.07]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-bold text-[#111111] dark:text-[#e8e7e4] tracking-tight">
              {text.ctaTitle}
            </h2>
            <Button size="lg" onClick={() => go(ctaPath)}>
              {text.ctaButton}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          {text.ctaNote && (
            <p className="mt-3 text-xs text-[#6B6A65] dark:text-[#908d89]">{text.ctaNote}</p>
          )}
        </div>
      </main>

      <footer className="border-t border-[#EAEAEA] dark:border-white/[0.07] bg-white dark:bg-[#1c1c1a] mt-auto">
        <div className="max-w-3xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#111111] dark:text-[#e8e7e4]">CVision</span>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#6B6A65] dark:text-[#908d89]">
            <a href={href('/how-ats-works')} className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{t('home.nav.howAts')}</a>
            <a href={href('/ats-uyumlu-cv-nasil-hazirlanir')} className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{t('home.nav.atsCvHowTo')}</a>
            {/* Turkish only, so linked only from the Turkish tree. */}
            {lang === 'tr' && (
              <a href="/on-yazi-ornekleri" className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{COVER_LETTER_PAGE.title}</a>
            )}
            <a href={href('/privacy')} className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{t('common.privacy')}</a>
            <a href={href('/terms')} className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{t('common.terms')}</a>
          </div>
        </div>
        <DeveloperCredit className="max-w-3xl mx-auto px-6 pb-5 -mt-2 text-center sm:text-left" />
      </footer>

    </div>
  );
}
