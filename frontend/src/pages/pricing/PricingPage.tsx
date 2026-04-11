import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import api from '../../services/api';
import {
  Check, Sparkles, Zap, Brain, FileText, ArrowLeft, Loader2, Globe, CreditCard, Shield, Lock,
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

  const [loadingIyzico, setLoadingIyzico] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIyzico = async () => {
    setError(null);
    setLoadingIyzico(true);
    try {
      const res = await api.post('/payment/iyzico/init');
      window.location.href = res.data.paymentPageUrl;
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.detail || 'iyzico payment could not be initiated.');
      setLoadingIyzico(false);
    }
  };

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
    <div className="w-full max-w-5xl mx-auto px-4 py-10 animate-in slide-up">

      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-10"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-5">
          <Sparkles className="w-3.5 h-3.5" /> Pro Membership
        </div>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
          Supercharge Your Career
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
          Unlock the full power of CVision AI. Get more analyses, deeper insights, and land interviews faster.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

        {/* Free */}
        <Card className="relative flex flex-col gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Free Plan</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-white">₺0</span>
              <span className="text-zinc-500 text-sm">/month</span>
            </div>
            <p className="text-xs text-zinc-600 mt-1">No credit card required</p>
          </div>

          <ul className="flex flex-col gap-3 flex-1">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-zinc-400">
                <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-zinc-500" />
                </div>
                {f}
              </li>
            ))}
          </ul>

          <div className="w-full py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 text-sm font-semibold text-center">
            {isPremium ? 'Previous Plan' : 'Current Plan'}
          </div>
        </Card>

        {/* Pro */}
        <div className="relative">
          {/* Glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-indigo-500/20 to-violet-500/10 blur-xl -z-10 scale-105" />

          <Card className="relative flex flex-col gap-6 border-indigo-500/30 bg-gradient-to-b from-indigo-950/50 to-zinc-900/90 overflow-visible">
            {/* Recommended badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
              <span className="flex items-center gap-1.5 px-4 py-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] font-black rounded-full shadow-xl shadow-indigo-500/30 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Recommended
              </span>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2">Pro Plan</p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-5xl font-black text-white">₺149</span>
                <span className="text-zinc-500 text-sm">/month</span>
                <span className="text-zinc-600 text-xs">or $4.99/mo</span>
              </div>
              <p className="text-xs text-indigo-400/60 mt-1">Cancel anytime</p>
            </div>

            <ul className="flex flex-col gap-3 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-zinc-200">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-indigo-400" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            {isPremium ? (
              <div className="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold text-center flex items-center justify-center gap-2">
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
                  onClick={handleIyzico}
                  disabled={loadingIyzico || loadingStripe}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    isTurkey
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5'
                      : 'bg-zinc-800/80 border border-zinc-700 text-zinc-300 hover:bg-zinc-700/80'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  {loadingIyzico ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  {isTurkey ? 'Pay with iyzico — ₺149/mo' : 'iyzico (Turkey) — ₺149/mo'}
                </button>

                <button
                  onClick={handleStripe}
                  disabled={loadingIyzico || loadingStripe}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    !isTurkey
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5'
                      : 'bg-zinc-800/80 border border-zinc-700 text-zinc-300 hover:bg-zinc-700/80'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  {loadingStripe ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  {!isTurkey ? 'Pay with Stripe — $4.99/mo' : 'Stripe (International) — $4.99/mo'}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-700">
                  <Lock className="w-3 h-3" /> Secure payment · Cancel anytime
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: <Brain className="w-5 h-5 text-violet-400" />, bg: 'bg-violet-500/10 border-violet-500/15', title: 'Full AI Access', desc: 'All suggestions unlocked, no limits.' },
          { icon: <Zap className="w-5 h-5 text-amber-400" />, bg: 'bg-amber-500/10 border-amber-500/15', title: '50 Analyses / Week', desc: '16× more capacity than the free plan.' },
          { icon: <FileText className="w-5 h-5 text-emerald-400" />, bg: 'bg-emerald-500/10 border-emerald-500/15', title: 'AI Rewriting', desc: 'Boost your bullet points with AI.' },
        ].map((item) => (
          <Card key={item.title} className={`flex items-start gap-4 border ${item.bg}`}>
            <div className={`p-2.5 rounded-xl ${item.bg} flex-shrink-0`}>{item.icon}</div>
            <div>
              <p className="font-bold text-white text-sm">{item.title}</p>
              <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-zinc-700">
        <Shield className="w-3.5 h-3.5" />
        Secure checkout &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; 24/7 support
      </div>
    </div>
  );
}
