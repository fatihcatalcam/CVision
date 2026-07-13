import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { Button } from '../../components/ui/Button';
import { useSeo } from '../../hooks/useSeo';

const CANONICAL = 'https://www.cvisionapp.com/how-ats-works';

export function HowAtsWorksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useSeo({
    title: t('howAts.metaTitle'),
    description: t('howAts.metaDescription'),
    canonical: CANONICAL,
  });

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
      mainEntityOfPage: { '@type': 'WebPage', '@id': CANONICAL },
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
            href="/"
            onClick={(e) => { e.preventDefault(); navigate('/'); }}
            className="flex items-center gap-1.5 text-sm text-[#787774] dark:text-[#908d89] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors"
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
              <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">
                {t(`howAts.s${i}Heading`)}
              </h2>
              <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
                {t(`howAts.s${i}Body`)}
              </p>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 pt-10 border-t border-[#EAEAEA] dark:border-white/[0.07] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-bold text-[#111111] dark:text-[#e8e7e4] tracking-tight">
            {t('howAts.ctaTitle')}
          </h2>
          <Button size="lg" onClick={() => navigate('/try')}>
            {t('howAts.ctaButton')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EAEAEA] dark:border-white/[0.07] bg-white dark:bg-[#1c1c1a] mt-auto">
        <div className="max-w-3xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#111111] dark:text-[#e8e7e4]">CVision</span>
          <div className="flex items-center gap-5 text-xs text-[#787774] dark:text-[#908d89]">
            <a href="/privacy" className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{t('common.privacy')}</a>
            <a href="/terms" className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{t('common.terms')}</a>
            <span>{t('common.copyright')}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
