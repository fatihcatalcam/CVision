import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { useSeo } from '../../hooks/useSeo';

export function TermsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useSeo({
    title: `${t('legal.terms.title')} - CVision`,
    canonical: 'https://www.cvisionapp.com/terms',
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>

      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-sm border-b border-[#EAEAEA] dark:border-white/[0.07]"
        style={{ background: 'color-mix(in srgb, var(--color-background) 95%, transparent)' }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-[#787774] dark:text-[#908d89] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </button>
          <span className="text-sm font-bold text-[#111111] dark:text-[#e8e7e4]">CVision</span>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-14 w-full">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#111111] dark:text-[#e8e7e4] tracking-tight mb-2">
            {t('legal.terms.title')}
          </h1>
          <p className="text-sm text-[#787774] dark:text-[#908d89]">{t('legal.terms.lastUpdated')}</p>
        </div>

        <div className="space-y-10 text-[#111111] dark:text-[#e8e7e4]">

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">{t('legal.terms.s1Heading')}</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              {t('legal.terms.s1Body')}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">{t('legal.terms.s2Heading')}</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              {t('legal.terms.s2Body')}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">{t('legal.terms.s3Heading')}</h2>
            <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              <li>{t('legal.terms.s3Item1')}</li>
              <li>{t('legal.terms.s3Item2')}</li>
              <li>{t('legal.terms.s3Item3')}</li>
              <li>{t('legal.terms.s3Item4')}</li>
              <li>{t('legal.terms.s3Item5')}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">{t('legal.terms.s4Heading')}</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">{t('legal.terms.s4Intro')}</p>
            <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              <li>{t('legal.terms.s4Item1')}</li>
              <li>{t('legal.terms.s4Item2')}</li>
              <li>{t('legal.terms.s4Item3')}</li>
              <li>{t('legal.terms.s4Item4')}</li>
              <li>{t('legal.terms.s4Item5')}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">{t('legal.terms.s5Heading')}</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              {t('legal.terms.s5Body')}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">{t('legal.terms.s6Heading')}</h2>
            <div className="space-y-3 text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              <p>{t('legal.terms.s6Body1')}</p>
              <p>{t('legal.terms.s6Body2')}</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">{t('legal.terms.s7Heading')}</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              {t('legal.terms.s7Body')}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">{t('legal.terms.s8Heading')}</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              {t('legal.terms.s8Body')}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">{t('legal.terms.s9Heading')}</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              {t('legal.terms.s9Body')}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">{t('legal.terms.s10Heading')}</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              {t('legal.terms.s10Body')}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">{t('legal.terms.s11Heading')}</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              {t('legal.terms.s11Body')}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">{t('legal.terms.s12Heading')}</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              {t('legal.terms.s12Body')}{' '}
              <a href="mailto:fthctlcm@outlook.com" className="text-[#1B3A6B] dark:text-[#4a7dd1] hover:underline font-medium">
                fthctlcm@outlook.com
              </a>
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EAEAEA] dark:border-white/[0.07] bg-white dark:bg-[#1c1c1a] mt-auto">
        <div className="max-w-3xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#111111] dark:text-[#e8e7e4]">CVision</span>
          <div className="flex items-center gap-5 text-xs text-[#787774] dark:text-[#908d89]">
            <a href="/privacy" className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{t('common.privacy')}</a>
            <a href="/terms" className="text-[#1B3A6B] dark:text-[#4a7dd1] font-medium">{t('common.terms')}</a>
            <span>{t('common.copyright')}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
