import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';

export function SuccessPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md animate-in slide-up">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#EDF3EC] border border-[#346538]/20 mb-6">
          <CheckCircle className="w-10 h-10 text-[#346538]" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-bold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          PRO ÜYELİK AKTİF
        </div>

        <h1 className="text-3xl font-bold text-[#111111] mb-3">Ödeme Başarılı!</h1>
        <p className="text-[#787774] mb-8 leading-relaxed">
          CVision Pro üyeliğiniz aktif edildi. Artık tüm premium özelliklerden yararlanabilirsiniz.
        </p>

        {/* Feature list */}
        <div className="surface rounded-2xl p-5 mb-8 text-left space-y-2.5">
          {[
            '50 CV analizi / hafta',
            'Tam AI öneri paketi (tümü açık)',
            'AI bullet point yeniden yazma',
            'Tam AI özet & analiz raporu',
          ].map((f) => (
            <div key={f} className="flex items-center gap-2.5 text-sm text-[#111111]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#346538] flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#111111] text-white font-bold hover:bg-[#2a2a2a] active:scale-[0.98] transition-all"
        >
          Dashboard'a Git
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
