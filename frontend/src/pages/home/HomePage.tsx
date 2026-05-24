import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { ArrowRight, Brain, BarChart3, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>

      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-sm border-b" style={{ background: 'color-mix(in srgb, var(--color-background) 95%, transparent)', borderColor: 'var(--color-card-border)' }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-mono font-medium tracking-tight text-base" style={{ color: 'var(--color-foreground)' }}>CVision</span>
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'var(--color-muted)' }}>
            <a href="#how-it-works" className="hover:text-[#111111] transition-colors">How it works</a>
            <a href="#features" className="hover:text-[#111111] transition-colors">Features</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!isLoading && (isAuthenticated ? (
              <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign in</Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>Get started</Button>
              </>
            ))}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 animate-in">
        <div className="max-w-3xl">
          <p className="label-sm mb-6">CV Analysis Platform</p>
          <h1 className="display-xl mb-6">
            Know exactly where<br />your CV stands
          </h1>
          <p className="text-lg leading-relaxed mb-10 max-w-xl" style={{ color: 'var(--color-muted)' }}>
            Upload your CV and receive a scored report with skill gaps,
            career role matches, and concrete improvements.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {!isLoading && (isAuthenticated ? (
              <Button size="lg" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => navigate('/register')}>
                  Analyze my CV
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="lg" onClick={() => navigate('/login')}>
                  Sign in
                </Button>
              </>
            ))}
          </div>
        </div>
      </section>

      <div className="divider max-w-5xl mx-auto px-6" />

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
        <p className="label-sm mb-12">How it works</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 stagger-grid">
          {[
            { n: '01', title: 'Upload your CV',     desc: 'Drop a PDF or plain text file. We accept any format up to 5MB.' },
            { n: '02', title: 'Select your domain', desc: 'Choose the industry you are targeting. Scoring adapts to domain standards.' },
            { n: '03', title: 'Get your report',    desc: 'Receive a scored analysis with strengths, gaps, skill tags, and career matches.' },
          ].map(({ n, title, desc }) => (
            <div key={n}>
              <span className="stat-number text-4xl font-medium block mb-4" style={{ color: 'var(--color-card-border)' }}>{n}</span>
              <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--color-foreground)' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider max-w-5xl mx-auto px-6" />

      {/* Features bento */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-20">
        <p className="label-sm mb-12">What you get</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-grid">
          <div className="surface p-8 md:row-span-2">
            <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center mb-6" style={{ background: 'var(--color-accent)' }}>
              <Brain className="w-4 h-4" style={{ color: 'var(--color-primary)' }} strokeWidth={1.5} />
            </div>
            <h3 className="font-sans text-2xl tracking-tight mb-3" style={{ color: 'var(--color-foreground)' }}>Intelligent scoring</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              A multi-dimensional score across formatting, content, keyword density,
              and domain fit. Each dimension is explained so you know precisely what to improve.
            </p>
          </div>
          <div className="surface p-6">
            <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center mb-4" style={{ background: 'var(--color-success-bg)' }}>
              <BarChart3 className="w-4 h-4" style={{ color: 'var(--color-success)' }} strokeWidth={1.5} />
            </div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-foreground)' }}>Career matching</h3>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>See which roles your CV fits today, and which skills would unlock new ones.</p>
          </div>
          <div className="surface p-6">
            <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center mb-4" style={{ background: 'var(--color-warning-bg)' }}>
              <FileText className="w-4 h-4" style={{ color: 'var(--color-warning)' }} strokeWidth={1.5} />
            </div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-foreground)' }}>Skill extraction</h3>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Skills automatically detected, tagged by confidence, pulled directly from your CV text.</p>
          </div>
        </div>
      </section>

      <div className="divider max-w-5xl mx-auto px-6" />

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'var(--color-card-border)' }}>
          {[
            { value: '10K+',  label: 'CVs analyzed' },
            { value: '14',    label: 'Industry domains' },
            { value: '< 30s', label: 'Average analysis time' },
          ].map(({ value, label }) => (
            <div key={label} className="px-8 first:pl-0 last:pr-0">
              <span className="stat-number text-3xl font-semibold block mb-1" style={{ color: 'var(--color-foreground)' }}>{value}</span>
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="divider max-w-5xl mx-auto px-6" />

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-20 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="font-sans text-3xl tracking-tight mb-2" style={{ color: 'var(--color-foreground)' }}>
            Ready to improve your CV?
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Free to start. No credit card required.</p>
        </div>
        {!isLoading && (isAuthenticated ? (
          <Button size="lg" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button size="lg" onClick={() => navigate('/register')}>
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Button>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: 'var(--color-card-border)', background: 'var(--color-card)' }}>
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-mono font-medium tracking-tight text-sm" style={{ color: 'var(--color-foreground)' }}>CVision</span>
          <div className="flex items-center gap-6 text-xs" style={{ color: 'var(--color-muted)' }}>
            <a href="#" className="hover:text-[#111111] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#111111] transition-colors">Terms</a>
            <span>Â© 2025 CVision</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
