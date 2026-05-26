import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  ArrowLeft, Loader2, Globe, CreditCard, Shield, Lock, CheckCircle2, Sparkles,
} from 'lucide-react';

const FREE_FEATURES = [
  '3 CV analyses per week',
  'ATS compatibility score',
  'Basic keyword analysis',
  'Career path suggestions',
];

const PRO_FEATURES = [
  '50 CV analyses per week',
  'Everything in Free',
  'Full AI suggestion pack (all unlocked)',
  'AI bullet point rewriting',
  'Full AI summary & analysis report',
  'Priority support',
];

function useIsTurkey(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locale = navigator.language || '';
    return tz.includes('Istanbul') || tz.includes('Turkey') || locale.startsWith('tr');
  } catch {
    return false;
  }
}

export function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTurkey = useIsTurkey();

  const [loadingStripe, setLoadingStripe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStripe = async () => {
    setError(null);
    setLoadingStripe(true);
    try {
      const res = await api.post('/payment/stripe/create-session');
      window.location.href = res.data.checkoutUrl;
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.detail || 'Stripe payment could not be initiated.');
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
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-sans text-4xl tracking-tight text-[#111111] dark:text-[#e8e7e4] mb-3">
            Simple, honest pricing
          </h1>
          <p className="text-base text-[#787774] dark:text-[#908d89]">Start free. Upgrade when you need more.</p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

          {/* Free */}
          <div className="surface p-8">
            <p className="label-sm mb-6">Free</p>
            <div className="mb-6">
              <span className="stat-number text-4xl font-semibold text-[#111111]">$0</span>
              <span className="text-sm text-[#787774] ml-1">/ month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-[#787774]">
                  <CheckCircle2 className="w-4 h-4 text-[#346538] mt-0.5 shrink-0" strokeWidth={1.5} />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="w-full py-2.5 px-4 bg-white dark:bg-[#1c1c1a] text-[#111111] dark:text-[#e8e7e4] text-sm font-medium rounded-[var(--radius-md)] border border-[#EAEAEA] dark:border-white/[0.07] text-center">
              {isPremium ? 'Previous Plan' : 'Current Plan'}
            </div>
          </div>

          {/* Pro */}
          <div className="bg-[#111111] rounded-[var(--radius-xl)] p-8">
            <p className="label-sm mb-6 text-[#787774]">Pro</p>
            <div className="mb-6">
              <span className="stat-number text-4xl font-semibold text-white">₺149</span>
              <span className="text-sm text-[#787774] ml-1">/ month</span>
              <span className="text-[#787774] text-xs ml-2">or $4.99/mo</span>
            </div>

            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-[#A09D9A]">
                  <CheckCircle2 className="w-4 h-4 text-[#346538] mt-0.5 shrink-0" strokeWidth={1.5} />
                  {feature}
                </li>
              ))}
            </ul>

            {isPremium ? (
              <div className="w-full py-2.5 px-4 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-[var(--radius-md)] text-center flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> You're on Pro
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {error && (
                  <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                    {error}
                  </div>
                )}

                <button
                  disabled
                  title="iyzico payment is coming soon"
                  className="w-full py-2.5 px-4 rounded-[var(--radius-md)] text-sm font-medium flex items-center justify-center gap-2 opacity-40 cursor-not-allowed bg-white/10 text-[#A09D9A] border border-white/10"
                >
                  <CreditCard className="w-4 h-4" />
                  {isTurkey ? 'iyzico - ₺149/mo (Coming soon)' : 'iyzico (Turkey) - Coming soon'}
                </button>

                <button
                  onClick={handleStripe}
                  disabled={loadingStripe}
                  className={`w-full py-2.5 px-4 rounded-[var(--radius-md)] text-sm font-medium transition-colors active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    !isTurkey
                      ? 'bg-white text-[#111111] hover:bg-[#F7F6F3]'
                      : 'bg-white/10 text-[#A09D9A] border border-white/10 hover:bg-white/20'
                  }`}
                >
                  {loadingStripe ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  {!isTurkey ? 'Pay with Stripe - $4.99/mo' : 'Stripe (International) - $4.99/mo'}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#787774]">
                  <Lock className="w-3 h-3" /> Secure payment Â· Cancel anytime
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-[#787774]">
          <Shield className="w-3.5 h-3.5" />
          Secure checkout &nbsp;Â·&nbsp; Cancel anytime &nbsp;Â·&nbsp; 24/7 support
        </div>

      </div>
    </div>
  );
}
