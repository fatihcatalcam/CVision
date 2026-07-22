import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, ArrowRight, Sparkles, Check, ScanSearch } from 'lucide-react';
import api from '../../services/api';
import { useSeo } from '../../hooks/useSeo';
import { CVUploader } from '../../components/cv/CVUploader';
import { AnalyzingScreen } from '../../components/analysis/AnalyzingScreen';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';

type Phase = 'upload' | 'processing' | 'done' | 'error';

interface AnonResult {
  scores: { overall_score: number; ats_score: number; keyword_score: number; completeness_score: number };
  ai_summary: string | null;
  is_summary_locked: boolean;
  ai_suggestions: { message: string | null; is_locked: boolean; teaser?: string | null }[];
  layout_xray?: {
    available: boolean;
    reason?: string | null;
    findings: { type: string; severity: string; page: number }[];
    findings_total: number;
    robot_lines: { t: string; m: boolean }[];
    is_locked: boolean;
  } | null;
}

const RING_R = 42;
const RING_C = 2 * Math.PI * RING_R;

function barColor(value: number) {
  return value >= 75 ? '#346538' : '#956400';
}

function scoreColor(value: number) {
  if (value >= 80) return '#346538';
  if (value >= 60) return '#956400';
  return '#9F2F2D';
}

export function TryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('upload');
  const [result, setResult] = useState<AnonResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const activeRef = useRef(true);

  useSeo({
    title: t('try.metaTitle'),
    description: t('try.metaDescription'),
    canonical: 'https://www.cvisionapp.com/try',
  });

  useEffect(() => () => { activeRef.current = false; }, []);

  // Animated progress while the anonymous analysis runs (mirrors AnalysisPage).
  useEffect(() => {
    if (phase !== 'processing') return;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev < 30) return prev + 2;
        if (prev < 60) return prev + 1;
        if (prev < 90) return prev + 0.5;
        if (prev < 95) return prev + 0.1;
        return prev;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [phase]);

  const handleUploaded = (sessionToken: string) => {
    setProgress(0);
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
        if (status.status === 'failed_no_text') { setErrorMsg(t('try.errorImagePdf')); setPhase('error'); return; }
        if (status.status === 'failed') { setErrorMsg(t('try.errorGeneric')); setPhase('error'); return; }
        if (status.status === 'completed') {
          const { data } = await api.get(`/public/analysis/${sessionToken}/results`);
          if (!activeRef.current) return;
          setProgress(100);
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
          <div className="flex flex-col items-center justify-center py-16">
            <AnalyzingScreen
              progress={progress}
              heading={t('try.processingHeading')}
              message={t('try.processingSub')}
              steps={[
                { label: t('try.step1'), threshold: 20 },
                { label: t('try.step2'), threshold: 45 },
                { label: t('try.step3'), threshold: 70 },
                { label: t('try.step4'), threshold: 90 },
              ]}
              footer={t('try.processingFooter')}
            />
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

        {phase === 'done' && result && (() => {
          const bars = [
            { label: t('scoreHero.ats'), value: result.scores.ats_score },
            { label: t('scoreHero.keywords'), value: result.scores.keyword_score },
            { label: t('scoreHero.completeness'), value: result.scores.completeness_score },
          ];
          const firstOpen = result.ai_suggestions.find(s => !s.is_locked && s.message);
          const lockedCount = result.ai_suggestions.filter(s => s.is_locked).length;
          const overall = Math.round(result.scores.overall_score);

          return (
          <div className="max-w-xl mx-auto">
            <h2 className="font-sans text-2xl tracking-tight mb-6" style={{ color: 'var(--color-foreground)' }}>{t('try.resultsHeading')}</h2>

            {/* Score hero card */}
            <div className="rounded-2xl border p-6 mb-4" style={{ borderColor: 'var(--color-card-border)', background: 'var(--color-card)' }}>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-28 h-28 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
                    <circle cx="50" cy="50" r={RING_R} fill="none" strokeWidth="8" className="stroke-[#F0EFEC] dark:stroke-white/[0.08]" />
                    <circle cx="50" cy="50" r={RING_R} fill="none" strokeWidth="8" strokeLinecap="round" stroke={scoreColor(overall)}
                      strokeDasharray={`${(overall / 100) * RING_C} ${RING_C}`} className="transition-all duration-700 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="stat-number text-3xl font-bold leading-none" style={{ color: 'var(--color-foreground)' }}>{overall}</span>
                    <span className="text-[10px] font-semibold tracking-wider text-[#A09D9A]">/ 100</span>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">{t('try.overallLabel')}</p>
                  {bars.map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-xs font-medium text-[#787774] dark:text-[#908d89] truncate">{label}</span>
                      <div className="flex-1 h-2 rounded-full bg-[#F0EFEC] dark:bg-white/[0.08] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.round(value)}%`, background: barColor(value) }} />
                      </div>
                      <span className="w-7 text-right stat-number text-xs font-bold" style={{ color: 'var(--color-foreground)' }}>{Math.round(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* First (open) AI suggestion */}
            {firstOpen && (
              <div className="rounded-2xl border p-5 mb-4" style={{ borderColor: 'var(--color-card-border)', background: 'var(--color-card)' }}>
                <div className="inline-flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-full bg-[#EDF3EC] dark:bg-[#346538]/20">
                  <Sparkles className="w-3 h-3 text-[#346538] dark:text-[#8fc79a]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#346538] dark:text-[#8fc79a]">{t('try.aiTipLabel')}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-foreground)' }}>{firstOpen.message}</p>
              </div>
            )}

            {/* ATS X-Ray teaser — the scanner's view, blurred + locked */}
            {result.layout_xray?.available && (
              <div className="rounded-2xl border p-5 mb-4" style={{ borderColor: 'var(--color-card-border)', background: 'var(--color-card)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-[#F7F6F3] dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                    <ScanSearch className="w-4 h-4" style={{ color: 'var(--color-foreground)' }} strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-extrabold" style={{ color: 'var(--color-foreground)' }}>
                    {result.layout_xray.findings_total > 0
                      ? t('xray.teaser.title', { count: result.layout_xray.findings_total })
                      : t('xray.teaser.titleClean')}
                  </span>
                </div>

                {result.layout_xray.findings[0] && (
                  <div className="rounded-xl border border-[#EAEAEA] dark:border-white/[0.07] border-l-[3px] border-l-[#956400] bg-[#FBF8F2] dark:bg-white/[0.03] px-3.5 py-2.5 mb-3">
                    <p className="text-xs font-bold" style={{ color: 'var(--color-foreground)' }}>
                      {t(`xray.finding.${result.layout_xray.findings[0].type}.title`)}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
                      {t(`xray.finding.${result.layout_xray.findings[0].type}.desc`)}
                    </p>
                  </div>
                )}

                {result.layout_xray.robot_lines.length > 0 && (
                  <div className="relative rounded-xl overflow-hidden bg-[#1c1c1a] p-3">
                    <div className="font-mono text-[10px] leading-relaxed text-[#c8c6c3] select-none pointer-events-none" style={{ filter: 'blur(3px)' }}>
                      {result.layout_xray.robot_lines.map((l, i) => <div key={i}>{l.t}</div>)}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="flex items-center gap-1.5 bg-[#1c1c1a]/90 border border-white/10 text-[#e8e7e4] text-[11px] font-bold px-3 py-1 rounded-full">
                        <Lock className="w-3 h-3" /> {t('xray.teaser.locked')}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    (window as any).gtag?.('event', 'xray_teaser_cta', { findings: result.layout_xray?.findings_total ?? 0 });
                    navigate('/register');
                  }}
                  className="w-full mt-3 px-6 py-3 rounded-xl text-sm font-semibold bg-[#111111] text-white hover:bg-[#2a2a2a] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {t('xray.teaser.cta')} <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-center text-[10px] mt-1.5" style={{ color: 'var(--color-muted)' }}>{t('xray.teaser.note')}</p>
              </div>
            )}

            {/* Locked upsell — content in normal flow so nothing clips */}
            <div className="relative rounded-2xl border overflow-hidden p-8 text-center" style={{ borderColor: 'var(--color-card-border)' }}>
              <div className="absolute inset-0 opacity-70" style={{ background: 'radial-gradient(ellipse at 50% 0%, var(--color-accent), transparent 70%)' }} />
              <div className="relative flex flex-col items-center">
                <div className="p-2.5 mb-3 rounded-full bg-[#EDF3EC] dark:bg-[#346538]/20">
                  <Lock className="w-5 h-5 text-[#346538] dark:text-[#8fc79a]" />
                </div>
                <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-[#346538]">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white">{t('try.freeBadge')}</span>
                </div>
                <h3 className="font-sans text-xl tracking-tight mb-1" style={{ color: 'var(--color-foreground)' }}>{t('try.unlockTitle')}</h3>
                {lockedCount > 0 && (
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-muted)' }}>{t('try.moreLocked', { count: lockedCount })}</p>
                )}
                <p className="text-sm font-medium mb-5 max-w-sm" style={{ color: 'var(--color-foreground)' }}>{t('try.freeNote')}</p>

                {/* Blurred previews of the real locked suggestions — show, don't tell */}
                <div className="w-full space-y-2.5 mb-6">
                  {result.ai_suggestions.filter(s => s.is_locked).map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-xl border p-3.5 text-left" style={{ borderColor: 'var(--color-card-border)', background: 'var(--color-card)' }}>
                      <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#A09D9A]" />
                      <span className="text-sm leading-relaxed select-none pointer-events-none" style={{ color: 'var(--color-foreground)', filter: 'blur(3.5px)' }}>
                        {s.teaser || t('try.lockedItem')}
                      </span>
                    </div>
                  ))}
                </div>

                <button onClick={() => navigate('/register')} className="px-6 py-3 rounded-xl text-sm font-semibold bg-[#111111] text-white hover:bg-[#2a2a2a] active:scale-[0.98] transition-all flex items-center gap-2">
                  {t('try.signupButton')} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          );
        })()}
      </main>
    </div>
  );
}
