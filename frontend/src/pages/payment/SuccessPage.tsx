import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, Coins, ArrowRight } from 'lucide-react';

/**
 * Where Lemon Squeezy sends the buyer after paying.
 *
 * It used to announce a Pro membership and list what it unlocked - 50 analyses
 * a week, the full suggestion pack - none of which exists any more. What was
 * actually bought is credits, so that is what this shows.
 *
 * The balance is polled rather than read once. Credits arrive on the webhook,
 * which is a separate request from Lemon's servers and can land after the
 * browser has already followed the redirect; showing the old balance at that
 * moment reads as "I paid and got nothing". Polling stops as soon as the number
 * moves, and gives up quietly after ~20s rather than spinning forever.
 */
export function SuccessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  // The balance we arrived with, captured before any refresh can change it.
  const initial = useRef<number | null>(null);
  const latest = useRef<number | null>(null);
  const [givenUp, setGivenUp] = useState(false);

  if (initial.current === null && user) initial.current = user.credits;
  if (user) latest.current = user.credits;

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    let tries = 0;

    const poll = async () => {
      await refreshUser();
      if (!alive) return;

      const arrived =
        initial.current !== null &&
        latest.current !== null &&
        latest.current > initial.current;

      if (arrived) return;
      if (++tries >= 10) { setGivenUp(true); return; }

      timer = setTimeout(poll, 2000);
    };

    timer = setTimeout(poll, 1500);
    return () => { alive = false; clearTimeout(timer); };
  }, []);

  const credits = user?.credits ?? 0;
  const added =
    initial.current !== null && credits > initial.current
      ? credits - initial.current
      : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-background)' }}>
      <div className="text-center max-w-md w-full animate-in">

        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full bg-[#EDF3EC] border border-[#346538]/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-[#346538]" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-[#111111] dark:text-[#e8e7e4] mb-3">
          {t('settings.success.title')}
        </h1>
        <p className="text-[#6B6A65] dark:text-[#908d89] mb-8 leading-relaxed">
          {t('settings.success.body')}
        </p>

        <div className="surface rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Coins className="w-5 h-5 text-[#956400]" />
            <span className="text-3xl font-black text-[#111111] dark:text-[#e8e7e4]">
              {credits}
            </span>
            <span className="text-sm text-[#6B6A65] dark:text-[#908d89]">
              {t('credits.unit')}
            </span>
          </div>

          <p className="text-xs text-[#6B6A65] dark:text-[#908d89]">
            {added !== null
              ? t('settings.success.added', { count: added })
              : givenUp
                ? t('settings.success.slow')
                : t('settings.success.waiting')}
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] font-bold hover:bg-[#2a2a2a] dark:hover:bg-[#d0cfcc] active:scale-[0.98] transition-all"
        >
          {t('settings.success.cta')}
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
}
