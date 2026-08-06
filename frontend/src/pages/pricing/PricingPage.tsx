import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSeo } from '../../hooks/useSeo';
import { useCreditPacks } from '../../hooks/useCreditPacks';
import api from '../../services/api';
import { ArrowLeft, Loader2, Coins, Shield, Lock, Gift } from 'lucide-react';

/**
 * Credit packs. Replaces the monthly subscription page.
 *
 * The reason for the switch is in the product, not the billing: job hunting is a
 * temporary need. A subscription asks someone to commit to a thing they hope to
 * stop needing in six weeks. A pack is bought once, used up, and bought again
 * the next time they are looking.
 *
 * No prices are rendered here. They live on the Lemon Squeezy variant, and the
 * checkout is the only place that can state them without risking a number the
 * next screen contradicts.
 */
export function PricingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  useSeo({
    title: t('settings.pricing.metaTitle'),
    description: t('settings.pricing.metaDescription'),
    canonical: 'https://www.cvisionapp.com/pricing',
  });

  const { packs } = useCreditPacks();
  const [loadingVariant, setLoadingVariant] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buy = async (variantId: string) => {
    setError(null);
    setLoadingVariant(variantId);
    try {
      const res = await api.post('/payment/lemon/create-checkout', { variant_id: variantId });
      window.location.href = res.data.checkoutUrl;
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.detail || t('settings.pricing.errorInit'));
      setLoadingVariant(null);
    }
  };

  // The middle pack is the one worth steering people to: big enough to cover a
  // real search, small enough not to need thinking about.
  const featuredIndex = packs && packs.length === 3 ? 1 : -1;

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#111110]">
      <div className="max-w-4xl mx-auto py-16 px-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-[#6B6A65] dark:text-[#908d89] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" /> {t('settings.pricing.back')}
        </button>

        <div className="text-center mb-4">
          <h1 className="font-sans text-3xl tracking-tight text-[#111111] dark:text-[#e8e7e4] mb-3">
            {t('packs.title')}
          </h1>
          <p className="text-[#6B6A65] dark:text-[#908d89] max-w-xl mx-auto leading-relaxed">
            {t('packs.subtitle')}
          </p>
        </div>

        {user && (
          <p className="text-center text-sm text-[#6B6A65] dark:text-[#908d89] mb-10">
            {t('packs.currentBalance', { credits: user.credits })}
          </p>
        )}

        {packs === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#6B6A65]" />
          </div>
        ) : packs.length === 0 ? (
          <div className="surface p-8 text-center">
            <p className="text-[#111111] dark:text-[#e8e7e4] mb-2">{t('packs.notOnSale')}</p>
            <p className="text-sm text-[#6B6A65] dark:text-[#908d89]">{t('packs.earnInstead')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {packs.map((pack, i) => (
              <div
                key={pack.variant_id}
                className={`surface p-6 flex flex-col ${
                  i === featuredIndex ? 'ring-2 ring-[#111111] dark:ring-[#e8e7e4]' : ''
                }`}
              >
                {i === featuredIndex && (
                  <span className="self-start mb-3 px-2 py-0.5 rounded-full bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] text-[10px] font-bold uppercase tracking-wider">
                    {t('packs.popular')}
                  </span>
                )}

                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-4 h-4 text-[#956400]" />
                  <span className="text-3xl font-black text-[#111111] dark:text-[#e8e7e4]">
                    {pack.credits}
                  </span>
                  <span className="text-sm text-[#6B6A65] dark:text-[#908d89]">
                    {t('credits.unit')}
                  </span>
                </div>

                <p className="text-xs text-[#6B6A65] dark:text-[#908d89] mb-6 leading-relaxed">
                  {t('packs.worth', { applications: Math.floor(pack.credits / 6) })}
                </p>

                <button
                  onClick={() => buy(pack.variant_id)}
                  disabled={loadingVariant !== null}
                  className="mt-auto w-full py-2.5 rounded-lg bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] text-sm font-bold hover:bg-[#2a2a2a] dark:hover:bg-[#f2f1ee] disabled:opacity-60 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {loadingVariant === pack.variant_id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : t('packs.buy')}
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-6 text-center text-sm text-[#9F2F2D] dark:text-[#d4524f]">{error}</p>
        )}

        <div className="mt-10 surface p-5 flex items-start gap-3">
          <Gift className="w-4 h-4 text-[#956400] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#6B6A65] dark:text-[#908d89] leading-relaxed">
            {t('packs.freeRoutes')}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-[#6B6A65] dark:text-[#908d89]">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> {t('settings.pricing.footerNote')}
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> {t('packs.noExpiry')}
          </span>
        </div>
      </div>
    </div>
  );
}
