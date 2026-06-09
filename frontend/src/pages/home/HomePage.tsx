import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { ArrowRight, Brain, BarChart3, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Reveal } from '../../components/ui/Reveal';
import { useSeo } from '../../hooks/useSeo';

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useSeo({
    title: 'CVision - AI CV Analizi & ATS Resume Checker',
    description: "Yapay zeka destekli CV analizi ve ATS resume checker. CV'ni yükle; anında ATS skoru, eksik anahtar kelimeler ve AI iyileştirme önerileri al. Ücretsiz başla.",
    canonical: 'https://www.cvisionapp.com/',
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>

      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-sm border-b" style={{ background: 'color-mix(in srgb, var(--color-background) 95%, transparent)', borderColor: 'var(--color-card-border)' }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-mono font-medium tracking-tight text-base" style={{ color: 'var(--color-foreground)' }}>CVision</span>
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'var(--color-muted)' }}>
            <a href="#how-it-works" className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{t('home.nav.howItWorks')}</a>
            <a href="#features" className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{t('home.nav.features')}</a>
            <a href="#faq" className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{t('home.nav.faq')}</a>
            <a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about'); }} className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{t('home.nav.about')}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            {!isLoading && (isAuthenticated ? (
              <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')}>
                {t('home.nav.dashboard')}
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>{t('home.nav.signIn')}</Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>{t('home.nav.getStarted')}</Button>
              </>
            ))}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-3xl stagger-hero">
          <p className="label-sm mb-6">{t('home.hero.label')}</p>
          <h1 className="display-xl mb-6">
            {t('home.hero.title')}
          </h1>
          <p className="text-lg leading-relaxed mb-10 max-w-xl" style={{ color: 'var(--color-muted)' }}>
            {t('home.hero.subtitle')}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {!isLoading && (isAuthenticated ? (
              <Button size="lg" onClick={() => navigate('/dashboard')}>
                {t('home.hero.ctaDashboard')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => navigate('/register')}>
                  {t('home.hero.ctaAnalyze')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="lg" onClick={() => navigate('/login')}>
                  {t('home.hero.ctaSignIn')}
                </Button>
              </>
            ))}
          </div>
        </div>
      </section>

      <div className="divider max-w-5xl mx-auto px-6" />

      {/* How it works */}
      <Reveal as="section" className="max-w-5xl mx-auto px-6 py-20">
        <div id="how-it-works">
        <p className="label-sm mb-12">{t('home.howItWorks.label')}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {([
            { n: '01', titleKey: 'home.howItWorks.step1Title', descKey: 'home.howItWorks.step1Desc' },
            { n: '02', titleKey: 'home.howItWorks.step2Title', descKey: 'home.howItWorks.step2Desc' },
            { n: '03', titleKey: 'home.howItWorks.step3Title', descKey: 'home.howItWorks.step3Desc' },
          ] as const).map(({ n, titleKey, descKey }) => (
            <div key={n}>
              <span className="stat-number text-4xl font-medium block mb-4" style={{ color: 'var(--color-card-border)' }}>{n}</span>
              <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--color-foreground)' }}>{t(titleKey)}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{t(descKey)}</p>
            </div>
          ))}
        </div>
        </div>
      </Reveal>

      <div className="divider max-w-5xl mx-auto px-6" />

      {/* Features bento */}
      <Reveal as="section" className="max-w-5xl mx-auto px-6 py-20">
        <div id="features">
        <p className="label-sm mb-12">{t('home.features.label')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="surface hover-lift p-8 md:row-span-2">
            <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center mb-6" style={{ background: 'var(--color-accent)' }}>
              <Brain className="w-4 h-4" style={{ color: 'var(--color-primary)' }} strokeWidth={1.5} />
            </div>
            <h3 className="font-sans text-2xl tracking-tight mb-3" style={{ color: 'var(--color-foreground)' }}>{t('home.features.scoringTitle')}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              {t('home.features.scoringDesc')}
            </p>
          </div>
          <div className="surface hover-lift p-6">
            <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center mb-4" style={{ background: 'var(--color-success-bg)' }}>
              <BarChart3 className="w-4 h-4" style={{ color: 'var(--color-success)' }} strokeWidth={1.5} />
            </div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-foreground)' }}>{t('home.features.careerTitle')}</h3>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{t('home.features.careerDesc')}</p>
          </div>
          <div className="surface hover-lift p-6">
            <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center mb-4" style={{ background: 'var(--color-warning-bg)' }}>
              <FileText className="w-4 h-4" style={{ color: 'var(--color-warning)' }} strokeWidth={1.5} />
            </div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-foreground)' }}>{t('home.features.skillsTitle')}</h3>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{t('home.features.skillsDesc')}</p>
          </div>
        </div>
        </div>
      </Reveal>

      <div className="divider max-w-5xl mx-auto px-6" />

      {/* Stats */}
      <Reveal as="section" className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'var(--color-card-border)' }}>
          {([
            { value: '10K+',  labelKey: 'home.stats.cvsLabel' },
            { value: '14',    labelKey: 'home.stats.domainsLabel' },
            { value: '< 30s', labelKey: 'home.stats.timeLabel' },
          ] as const).map(({ value, labelKey }) => (
            <div key={labelKey} className="px-8 first:pl-0 last:pr-0">
              <span className="stat-number text-3xl font-semibold block mb-1" style={{ color: 'var(--color-foreground)' }}>{value}</span>
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{t(labelKey)}</span>
            </div>
          ))}
        </div>
      </Reveal>

      <div className="divider max-w-5xl mx-auto px-6" />

      {/* FAQ */}
      <Reveal as="section" className="max-w-5xl mx-auto px-6 py-20">
        <div id="faq">
          <p className="label-sm mb-12">{t('home.faq.label')}</p>
          <div className="max-w-3xl space-y-8">
            {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map((i) => (
              <div key={i}>
                <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--color-foreground)' }}>
                  {t(`home.faq.q${i}`)}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  {t(`home.faq.a${i}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="divider max-w-5xl mx-auto px-6" />

      {/* CTA */}
      <Reveal as="section" className="max-w-5xl mx-auto px-6 py-20 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="font-sans text-3xl tracking-tight mb-2" style={{ color: 'var(--color-foreground)' }}>
            {t('home.cta.title')}
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{t('home.cta.subtitle')}</p>
        </div>
        {!isLoading && (isAuthenticated ? (
          <Button size="lg" onClick={() => navigate('/dashboard')}>
            {t('home.cta.ctaDashboard')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button size="lg" onClick={() => navigate('/register')}>
            {t('home.cta.button')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        ))}
      </Reveal>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: 'var(--color-card-border)', background: 'var(--color-card)' }}>
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-mono font-medium tracking-tight text-sm" style={{ color: 'var(--color-foreground)' }}>CVision</span>
          <div className="flex items-center gap-6 text-xs" style={{ color: 'var(--color-muted)' }}>
            <a href="/about" className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{t('home.nav.about')}</a>
            <a href="/privacy" className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{t('common.privacy')}</a>
            <a href="/terms" className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{t('common.terms')}</a>
            <span>{t('common.copyright')}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
