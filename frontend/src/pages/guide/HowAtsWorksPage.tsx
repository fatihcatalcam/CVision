import { useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { Button } from '../../components/ui/Button';
import { useSeo } from '../../hooks/useSeo';
import { useLocalizedNav } from '../../hooks/useLocalizedNav';
import { ATS_GUIDE_EXTRA } from '../../content/atsGuide';
import { localizedUrl } from '../../i18n/routes';

export function HowAtsWorksPage() {
  const { t } = useTranslation();
  const { href, go, lang } = useLocalizedNav();

  // Was a module-level constant pointing at the Turkish URL. This component
  // renders at /en/how-ats-works too, where that string told Google the
  // English page was a duplicate of the Turkish one.
  const canonical = localizedUrl('/how-ats-works', lang);

  useSeo({
    title: t('howAts.metaTitle'),
    description: t('howAts.metaDescription'),
  });

  // The long-form sections exist for the languages that have URLs of their own;
  // the rest keep the six-section page they already had. See content/atsGuide.
  const extra = ATS_GUIDE_EXTRA[lang] ?? [];

  // Article JSON-LD for this guide. Injected per-route and removed on unmount so
  // it never lingers on other pages. Kept in the active language.
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-page', 'how-ats-works');
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: t('howAts.title'),
      description: t('howAts.metaDescription'),
      inLanguage: document.documentElement.lang || 'en',
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      author: { '@type': 'Organization', name: 'CVision' },
      publisher: { '@id': 'https://www.cvisionapp.com/#organization' },
    });
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [t]);

  const sections = [1, 2, 3, 4, 5, 6] as const;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>

      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-sm border-b border-[#EAEAEA] dark:border-white/[0.07]"
        style={{ background: 'color-mix(in srgb, var(--color-background) 95%, transparent)' }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <a
            href={href('/')}
            onClick={(e) => { e.preventDefault(); go('/'); }}
            className="flex items-center gap-1.5 text-sm text-[#6B6A65] dark:text-[#908d89] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('howAts.back')}
          </a>
          <span className="text-sm font-bold text-[#111111] dark:text-[#e8e7e4]">CVision</span>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-14 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#111111] dark:text-[#e8e7e4] tracking-tight mb-6">
            {t('howAts.title')}
          </h1>
          {/* Entity definition — the paragraph AI systems lift verbatim. */}
          <p className="text-base leading-relaxed text-[#444] dark:text-[#c8c6c3]">
            {t('howAts.definition')}
          </p>
        </div>

        <div className="space-y-10">
          {sections.map((i) => (
            <section key={i} className="space-y-3">
              <h2 className="text-base font-bold uppercase tracking-wider text-[#6B6A65] dark:text-[#908d89]">
                {t(`howAts.s${i}Heading`)}
              </h2>
              <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
                {t(`howAts.s${i}Body`)}
              </p>
            </section>
          ))}

          {/* The long-form half. Same markup as above so the page reads as one
              article, and the same content the prerender script emits - text
              only the static HTML shows is text Google throws away when it
              renders the page for real. */}
          {extra.map((section) => (
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
                </div>
              ))}
              {section.outro && (
                <p className="pt-2 text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
                  {section.outro}
                </p>
              )}
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 pt-10 border-t border-[#EAEAEA] dark:border-white/[0.07] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-bold text-[#111111] dark:text-[#e8e7e4] tracking-tight">
            {t('howAts.ctaTitle')}
          </h2>
          <Button size="lg" onClick={() => go('/try')}>
            {t('howAts.ctaButton')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EAEAEA] dark:border-white/[0.07] bg-white dark:bg-[#1c1c1a] mt-auto">
        <div className="max-w-3xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#111111] dark:text-[#e8e7e4]">CVision</span>
          <div className="flex items-center gap-5 text-xs text-[#6B6A65] dark:text-[#908d89]">
            <a href={href('/privacy')} className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{t('common.privacy')}</a>
            <a href={href('/terms')} className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{t('common.terms')}</a>
            <span>{t('common.copyright')}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
