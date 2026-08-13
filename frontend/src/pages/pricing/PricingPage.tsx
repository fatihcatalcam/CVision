import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSeo } from '../../hooks/useSeo';
import { useCreditPacks, formatPrice } from '../../hooks/useCreditPacks';
import api from '../../services/api';
import { ArrowLeft, Loader2, Shield, Lock, Gift } from 'lucide-react';
import {
  ANALYSIS_COST, UNLOCK_COST, MATCH_COST, COVER_LETTER_COST,
} from '../../constants/credits';

/**
 * Credit packs. Replaces the monthly subscription page.
 *
 * The reason for the switch is in the product, not the billing: job hunting is a
 * temporary need. A subscription asks someone to commit to a thing they hope to
 * stop needing in six weeks. A pack is bought once, used up, and bought again
 * the next time they are looking.
 *
 * Prices come from Lemon Squeezy rather than from our own config, so there is
 * exactly one number: a copy in an env var is a copy that can disagree with the
 * checkout, and the checkout is the one that takes the money. A pack Lemon
 * cannot be read for renders without a price rather than with a guess.
 *
 * This route is PUBLIC. It sat behind ProtectedRoute, which meant nobody could
 * see what CVision costs without first creating an account - and robots.txt
 * had to Disallow it, so the prices were invisible to search as well. Two
 * things follow from letting logged-out visitors in, and both are handled
 * below: they have no session to check out with, and they may have arrived
 * straight from a search result with no history to go "back" to.
 */
export function PricingPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useSeo({
    title: t('settings.pricing.metaTitle'),
    description: t('settings.pricing.metaDescription'),
    canonical: 'https://www.cvisionapp.com/pricing',
  });

  const { packs } = useCreditPacks();
  const [loadingVariant, setLoadingVariant] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buy = async (variantId: string) => {
    // No session, no checkout. Sending them to the API anyway would answer 401
    // and print an error under a price they just decided they wanted, which is
    // the worst possible moment to stall. Signup is the actual next step.
    if (!user) {
      navigate('/register');
      return;
    }
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

  // Per-credit cost of the smallest pack - the reference every other pack's
  // saving is measured against. Packs arrive sorted smallest first.
  const cheapest = packs?.[0];
  const baseUnit =
    cheapest && cheapest.price != null ? cheapest.price / cheapest.credits : null;

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#111110]">
      <div className="max-w-4xl mx-auto py-16 px-6">
        {/* react-router labels the first entry in a session "default". Landing
            here straight from a search result means there is nothing behind us,
            and navigate(-1) would leave the visitor on a button that does
            nothing. Home is the honest destination in that case. */}
        <button
          onClick={() => (location.key === 'default' ? navigate('/') : navigate(-1))}
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
          <p className="text-center text-sm text-[#6B6A65] dark:text-[#908d89] mb-8">
            {t('packs.currentBalance', { credits: user.credits })}
          </p>
        )}

        {/* What a credit is. The packs quote a number of credits, which means
            nothing on its own to someone seeing the page for the first time. */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-10 py-3 px-5 rounded-xl border border-[#EAEAEA] dark:border-white/[0.07]">
          {[
            { label: t('settings.credits.priceAnalysis'), cost: ANALYSIS_COST },
            { label: t('settings.credits.pricePro'), cost: ANALYSIS_COST + UNLOCK_COST },
            { label: t('settings.credits.priceMatch'), cost: MATCH_COST },
            { label: t('settings.credits.priceCoverLetter'), cost: COVER_LETTER_COST },
          ].map(({ label, cost }) => (
            <span key={label} className="text-xs text-[#6B6A65] dark:text-[#908d89] whitespace-nowrap">
              {label}{' '}
              <span className="font-mono font-bold text-[#956400]">{cost}</span>
            </span>
          ))}
        </div>

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
          /* items-stretch so a card with a badge does not stand taller than its
             neighbours and knock the row out of line. */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {packs.map((pack, i) => {
              const featured = i === featuredIndex;
              const price = formatPrice(pack, i18n.language);
              // What one credit costs here. This is the only thing that makes a
              // bigger pack visibly the better deal - the badge on the middle
              // card was asserting it with no evidence on the page.
              const unit = pack.price != null ? pack.price / pack.credits : null;
              const perCredit = unit != null
                ? formatPrice({ price: Math.round(unit), currency: pack.currency }, i18n.language)
                : null;
              // Measured against the smallest pack, which is the reference
              // anyone compares to. Hidden under 5%, where it reads as noise.
              const saving = unit != null && baseUnit != null && unit < baseUnit
                ? Math.round((1 - unit / baseUnit) * 100)
                : 0;

              return (
                <div
                  key={pack.variant_id}
                  className={`relative rounded-2xl p-6 flex flex-col border transition-all ${
                    featured
                      ? 'bg-white dark:bg-[#1c1c1a] border-[#111111] dark:border-[#e8e7e4] shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] md:-mt-3 md:mb-3'
                      : 'surface border-[#EAEAEA] dark:border-white/[0.07] hover:border-[#8A8985] dark:hover:border-white/[0.2]'
                  }`}
                >
                  {featured && (
                    <span className="absolute -top-2.5 left-6 px-2 py-0.5 rounded-full bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] text-[10px] font-bold uppercase tracking-wider">
                      {t('packs.popular')}
                    </span>
                  )}

                  <div className="flex items-baseline justify-between gap-2 mb-4">
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-[#111111] dark:text-[#e8e7e4]">
                        {pack.credits}
                      </span>
                      <span className="text-sm text-[#6B6A65] dark:text-[#908d89]">
                        {t('credits.unit')}
                      </span>
                    </span>
                    {saving >= 5 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#EDF3EC] dark:bg-[#346538]/20 text-[#346538] dark:text-[#5a9b5e] text-[10px] font-bold whitespace-nowrap">
                        {t('packs.saving', { percent: saving })}
                      </span>
                    )}
                  </div>

                  {price && (
                    <div className="mb-4 pb-4 border-b border-[#EAEAEA] dark:border-white/[0.07]">
                      <p className="text-[28px] leading-none font-bold text-[#111111] dark:text-[#e8e7e4]">
                        {price}
                      </p>
                      {perCredit && (
                        <p className="text-[11px] text-[#6B6A65] dark:text-[#908d89] mt-1.5">
                          {t('packs.perCredit', { price: perCredit })}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-[#6B6A65] dark:text-[#908d89] mb-6 leading-relaxed">
                    {t('packs.worth', { count: Math.floor(pack.credits / 6) })}
                  </p>

                  <button
                    onClick={() => buy(pack.variant_id)}
                    disabled={loadingVariant !== null}
                    className={`mt-auto w-full py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                      featured
                        ? 'bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] hover:bg-[#2a2a2a] dark:hover:bg-[#f2f1ee]'
                        : 'bg-transparent text-[#111111] dark:text-[#e8e7e4] border border-[#8A8985] dark:border-white/[0.36] hover:bg-[#F7F6F3] dark:hover:bg-[#272725]'
                    }`}
                  >
                    {loadingVariant === pack.variant_id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : user ? t('packs.buy') : t('packs.signUpToBuy')}
                  </button>
                </div>
              );
            })}
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

        {/* Below the packs so it never delays the decision, but in the DOM as
            well as in the prerendered HTML. The cards above are fetched from
            Lemon Squeezy at runtime, so without this a crawler sees a heading
            and nothing else - and this page is only worth making public if
            there is something on it to read. */}
        <section className="mt-16 max-w-2xl mx-auto space-y-8">
          {([
            ['seo.h2a', ['seo.p1', 'seo.p2']],
            ['seo.h2b', ['seo.p3']],
          ] as const).map(([headingKey, bodyKeys]) => (
            <div key={headingKey} className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight text-[#111111] dark:text-[#e8e7e4]">
                {t(`packs.${headingKey}`)}
              </h2>
              {bodyKeys.map((k) => (
                <p key={k} className="text-sm leading-relaxed text-[#6B6A65] dark:text-[#908d89]">
                  {t(`packs.${k}`)}
                </p>
              ))}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
