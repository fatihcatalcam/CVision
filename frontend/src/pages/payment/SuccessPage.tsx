import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      api.post('/payment/stripe/verify-session', { session_id: sessionId })
        .catch(() => {})
        .finally(() => refreshUser());
    } else {
      refreshUser();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md animate-in slide-up">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          PRO ÜYELİK AKTİF
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Ödeme Başarılı!</h1>
        <p className="text-[var(--color-muted)] mb-8 leading-relaxed">
          CVision Pro üyeliğiniz aktif edildi. Artık tüm premium özelliklerden yararlanabilirsiniz.
        </p>

        {/* Feature list */}
        <div className="glass-card rounded-2xl p-5 mb-8 text-left space-y-2.5">
          {[
            '50 CV analizi / hafta',
            'Tam AI öneri paketi (tümü açık)',
            'AI bullet point yeniden yazma',
            'Tam AI özet & analiz raporu',
          ].map((f) => (
            <div key={f} className="flex items-center gap-2.5 text-sm text-zinc-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:brightness-110 transition-all"
        >
          Dashboard'a Git
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
