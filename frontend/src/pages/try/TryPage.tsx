import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Loader2, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useSeo } from '../../hooks/useSeo';
import { CVUploader } from '../../components/cv/CVUploader';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';

type Phase = 'upload' | 'processing' | 'done' | 'error';

interface AnonResult {
  scores: { overall_score: number; ats_score: number; keyword_score: number; completeness_score: number };
  ai_summary: string | null;
  is_summary_locked: boolean;
  ai_suggestions: { message: string | null; is_locked: boolean }[];
}

const RING_R = 34;
const RING_C = 2 * Math.PI * RING_R;

export function TryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('upload');
  const [result, setResult] = useState<AnonResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const activeRef = useRef(true);

  useSeo({
    title: t('try.metaTitle'),
    description: t('try.metaDescription'),
    canonical: 'https://www.cvisionapp.com/try',
  });

  useEffect(() => () => { activeRef.current = false; }, []);

  const handleUploaded = (sessionToken: string) => {
    setPhase('processing');
    const startTime = Date.now();
    const timeout = 60000;

    const check = async () => {
      if (!activeRef.current) return;
      if (Date.now() - startTime > timeout) {
        setErrorMsg(t('try.errorGeneric'));
        setPhase('error');
        return;
      }
      try {
        const { data: status } = await api.get(`/public/analysis/${sessionToken}/status`);
        if (status.status === 'failed') { setErrorMsg(t('try.errorGeneric')); setPhase('error'); return; }
        if (status.status === 'completed') {
          const { data } = await api.get(`/public/analysis/${sessionToken}/results`);
          if (!activeRef.current) return;
          setResult(data);
          setPhase('done');
          return;
        }
        setTimeout(check, 2000);
      } catch {
        if (activeRef.current) setTimeout(check, 3000);
      }
    };
    check();
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <header className="sticky top-0 z-50 backdrop-blur-sm border-b" style={{ background: 'color-mix(in srgb, var(--color-background) 95%, transparent)', borderColor: 'var(--color-card-border)' }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="font-mono font-medium tracking-tight text-base" style={{ color: 'var(--color-foreground)' }}>CVision</button>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {phase === 'upload' && (
          <div>
            <h1 className="font-sans text-3xl tracking-tight mb-2" style={{ color: 'var(--color-foreground)' }}>{t('try.heading')}</h1>
            <p className="text-base mb-8" style={{ color: 'var(--color-muted)' }}>{t('try.sub')}</p>
            <CVUploader anonymous onUploadSuccess={handleUploaded} />
          </div>
        )}

        {phase === 'processing' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="w-10 h-10 animate-spin mb-6" style={{ color: 'var(--color-muted)' }} />
            <h2 className="font-sans text-2xl tracking-tight mb-2" style={{ color: 'var(--color-foreground)' }}>{t('try.processingHeading')}</h2>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{t('try.processingSub')}</p>
          </div>
        )}

        {phase === 'error' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-base mb-6" style={{ color: 'var(--color-foreground)' }}>{errorMsg || t('try.errorGeneric')}</p>
            <button onClick={() => { setPhase('upload'); setResult(null); }} className="px-4 py-2 rounded-xl text-sm font-medium bg-[#111111] text-white hover:bg-[#2a2a2a] transition-colors">
              {t('try.tryAgain')}
            </button>
          </div>
        )}

        {phase === 'done' && result && (
          <div>
            <h2 className="font-sans text-2xl tracking-tight mb-6" style={{ color: 'var(--color-foreground)' }}>{t('try.resultsHeading')}</h2>

            {/* Score ring */}
            <div className="flex items-center gap-6 mb-8">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
                  <circle cx="40" cy="40" r={RING_R} fill="none" strokeWidth="6" className="stroke-[#F0EFEC] dark:stroke-white/[0.08]" />
                  <circle cx="40" cy="40" r={RING_R} fill="none" strokeWidth="6" strokeLinecap="round" stroke="#346538"
                    strokeDasharray={`${(result.scores.overall_score / 100) * RING_C} ${RING_C}`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="stat-number text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>{Math.round(result.scores.overall_score)}</span>
                </div>
              </div>
              <div className="space-y-1.5 text-sm" style={{ color: 'var(--color-muted)' }}>
                <div>ATS: <span className="font-semibold" style={{ color: 'var(--color-foreground)' }}>{Math.round(result.scores.ats_score)}</span></div>
                <div>Keywords: <span className="font-semibold" style={{ color: 'var(--color-foreground)' }}>{Math.round(result.scores.keyword_score)}</span></div>
                <div>Completeness: <span className="font-semibold" style={{ color: 'var(--color-foreground)' }}>{Math.round(result.scores.completeness_score)}</span></div>
              </div>
            </div>

            {/* First (open) suggestion */}
            {result.ai_suggestions.filter(s => !s.is_locked && s.message).slice(0, 1).map((s, i) => (
              <div key={i} className="p-4 rounded-xl border mb-3" style={{ borderColor: 'var(--color-card-border)' }}>
                <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>{s.message}</p>
              </div>
            ))}

            {/* Locked upsell */}
            <div className="relative mt-6 rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-card-border)' }}>
              <div className="p-8 blur-[3px] opacity-40 select-none pointer-events-none space-y-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-4 rounded" style={{ background: 'var(--color-card-border)' }} />
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 backdrop-blur-sm bg-white/60 dark:bg-[#111110]/70">
                <div className="p-2 mb-3 rounded-full bg-[#F1F1EF] dark:bg-white/[0.06]">
                  <Lock className="w-5 h-5 text-[#787774]" />
                </div>
                <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--color-foreground)' }}>{t('try.unlockTitle')}</h3>
                <p className="text-sm mb-4 max-w-sm" style={{ color: 'var(--color-muted)' }}>{t('try.unlockBody')}</p>
                <button onClick={() => navigate('/register')} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#111111] text-white hover:bg-[#2a2a2a] transition-colors flex items-center gap-2">
                  {t('try.signupButton')} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
