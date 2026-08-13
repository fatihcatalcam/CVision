import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Home, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSeo } from '../hooks/useSeo';

/**
 * What an unknown URL gets.
 *
 * It used to be `<Navigate to="/dashboard" />`, which sent a logged-out visitor
 * with a mistyped or stale link to a protected route, from there to the login
 * screen, with nothing anywhere explaining what had happened.
 *
 * The SEO half matters more than it looks. Vercel rewrites every path to
 * index.html, so a missing page answers HTTP 200 and Google reads it as a soft
 * 404 - it wastes crawl budget and can index URLs that do not exist. A pure SPA
 * cannot return a real 404 status for arbitrary paths, so `noindex` is the
 * honest substitute, and it is the part that actually fixes the crawling.
 *
 * The route is also an opportunity rather than a dead end: somebody is here
 * because they wanted something, so the free analysis is the primary action.
 */
export function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useSeo({
    title: t('notFound.metaTitle'),
    noindex: true,
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#FBFBFA] dark:bg-[#111110]">
      <div className="w-full max-w-md text-center animate-in slide-up">

        <p className="font-mono text-6xl font-black text-[#EAEAEA] dark:text-white/[0.12] mb-4 select-none">
          404
        </p>

        <h1 className="font-sans text-2xl tracking-tight text-[#111111] dark:text-[#e8e7e4] mb-3">
          {t('notFound.heading')}
        </h1>
        <p className="text-sm text-[#6B6A65] dark:text-[#908d89] leading-relaxed mb-8">
          {t('notFound.body')}
        </p>

        <div className="flex flex-col gap-2.5">
          {/* The free analysis first: whoever landed here wanted something. */}
          <button
            onClick={() => navigate(user ? '/dashboard' : '/try')}
            className="w-full h-11 rounded-xl bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] text-sm font-bold hover:bg-[#2a2a2a] dark:hover:bg-[#f2f1ee] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {user ? t('notFound.dashboard') : t('notFound.tryFree')}
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full h-11 rounded-xl bg-transparent text-[#111111] dark:text-[#e8e7e4] border border-[#8A8985] dark:border-white/[0.36] text-sm font-bold hover:bg-[#F7F6F3] dark:hover:bg-[#272725] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            {t('notFound.home')}
          </button>
        </div>
      </div>
    </div>
  );
}
