import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTryToUsd } from '../../hooks/useTryToUsd';
import { useSeo } from '../../hooks/useSeo';
import api from '../../services/api';
import {
  ArrowLeft, Loader2, CreditCard, Shield, Lock, CheckCircle2, Sparkles, Gift,
} from 'lucide-react';

const FREE_FEATURE_KEYS = [
  'settings.pricing.freeF1',
  'settings.pricing.freeF2',
  'settings.pricing.freeF3',
  'settings.pricing.freeF4',
];

const PRO_FEATURE_KEYS = [
  'settings.pricing.proF1',
  'settings.pricing.proF2',
  'settings.pricing.proF3',
  'settings.pricing.proF4',
  'settings.pricing.proF5',
  'settings.pricing.proF6',
];

export function PricingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { isTurkey, usdPrice } = useTryToUsd();

  useSeo({
    title: t('settings.pricing.metaTitle'),
    description: t('settings.pricing.metaDescription'),
    canonical: 'https://www.cvisionapp.com/pricing',
  });
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStripe = async () => {
    setError(null);
    setLoadingStripe(true);
    try {
      const res = await api.post('/payment/lemon/create-checkout');
      window.location.href = res.data.checkoutUrl;
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.detail || t('settings.pricing.errorInit'));
      setLoadingStripe(false);
    }
  };

  const isPremium = user?.plan_type === 'premium';

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#111110]">
      <div className="max-w-4xl mx-auto py-16 px-6">

        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm text-[#787774] dark:text-[#908d89] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" /> {t('common.backToDashboard')}
        </button>

        {/* Free trial banner */}
        <div className="flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-2xl px-5 py-3 mb-10 text-sm font-medium">
          <Gift className="w-4 h-4 shrink-0" />
          <span>{t('settings.pricing.trialBanner')}</span>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-sans text-4xl tracking-tight text-[#111111] dark:text-[#e8e7e4] mb-3">
            {t('settings.pricing.header')}
          </h1>
          <p className="text-base text-[#787774] dark:text-[#908d89]">
            {isTurkey
              ? t('settings.pricing.subheader')
              : t('settings.pricing.subheaderIntl', { price: usdPrice ? `$${usdPrice}` : '~$4' })}
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

          {/* Free */}
          <div className="surface hover-lift p-8">
            <p className="label-sm mb-6">{t('settings.pricing.planFree')}</p>
            <div className="mb-6">
              <span className="stat-number text-4xl font-semibold text-[#111111] dark:text-[#e8e7e4]">$0</span>
              <span className="text-sm text-[#787774] dark:text-[#908d89] ml-1">{t('settings.pricing.freePerMonth')}</span>
            </div>

            <ul className="space-y-3 mb-8">
              {FREE_FEATURE_KEYS.map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm text-[#787774] dark:text-[#908d89]">
                  <CheckCircle2 className="w-4 h-4 text-[#346538] mt-0.5 shrink-0" strokeWidth={1.5} />
                  {t(key)}
                </li>
              ))}
            </ul>

            <div className="w-full py-2.5 px-4 bg-white dark:bg-[#1c1c1a] text-[#111111] dark:text-[#e8e7e4] text-sm font-medium rounded-[var(--radius-md)] border border-[#EAEAEA] dark:border-white/[0.07] text-center">
              {isPremium ? t('settings.pricing.previousPlan') : t('settings.pricing.currentPlan')}
            </div>
          </div>

          {/* Pro */}
          <div className="bg-[#111111] rounded-[var(--radius-xl)] hover-lift p-8 border border-transparent dark:border-white/[0.08]">
            <div className="flex items-center justify-between mb-6">
              <p className="label-sm text-[#787774]">{t('settings.pricing.planPro')}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                <Gift className="w-3 h-3" /> {t('settings.pricing.trialBadge')}
              </span>
            </div>
            <div className="mb-6">
              {isTurkey ? (
                <>
                  <span className="stat-number text-4xl font-semibold text-white">₺199.99</span>
                  <span className="text-sm text-[#787774] ml-1">{t('settings.pricing.freePerMonth')}</span>
                </>
              ) : (
                <>
                  <span className="stat-number text-4xl font-semibold text-white">
                    {usdPrice ? `$${usdPrice}` : '...'}
                  </span>
                  <span className="text-sm text-[#787774] ml-1">{t('settings.pricing.freePerMonth')}</span>
                  <p className="text-[11px] text-[#787774] mt-1.5 italic">{t('settings.pricing.chargedNote')}</p>
                </>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {PRO_FEATURE_KEYS.map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm text-[#A09D9A]">
                  <CheckCircle2 className="w-4 h-4 text-[#346538] mt-0.5 shrink-0" strokeWidth={1.5} />
                  {t(key)}
                </li>
              ))}
            </ul>

            {isPremium ? (
              <div className="w-full py-2.5 px-4 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-[var(--radius-md)] text-center flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> {t('settings.pricing.youreOnPro')}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {error && (
                  <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleStripe}
                  disabled={loadingStripe}
                  className="w-full py-2.5 px-4 rounded-[var(--radius-md)] text-sm font-medium transition-colors active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-[#111111] hover:bg-[#F7F6F3]"
                >
                  {loadingStripe ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  {t('settings.pricing.ctaButton')}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#787774]">
                  <Lock className="w-3 h-3" /> {t('settings.pricing.noCard')}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-[#787774]">
          <Shield className="w-3.5 h-3.5" />
          {t('settings.pricing.footerNote')}
        </div>

      </div>
    </div>
  );
}
