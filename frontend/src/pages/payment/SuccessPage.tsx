import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';

export function SuccessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    refreshUser();
  }, []);

  const features = [
    t('settings.success.f1'),
    t('settings.success.f2'),
    t('settings.success.f3'),
    t('settings.success.f4'),
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-background)' }}>
      <div className="text-center max-w-md w-full animate-in slide-up">

        {/* Success icon */}
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full bg-[#EDF3EC] border border-[#346538]/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-[#346538]" />
          </div>
        </div>

        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            {t('settings.success.badge')}
          </span>
        </div>

        <h1 className="text-3xl font-bold text-[#111111] dark:text-[#e8e7e4] mb-3">
          {t('settings.success.title')}
        </h1>
        <p className="text-[#787774] dark:text-[#908d89] mb-8 leading-relaxed">
          {t('settings.success.body')}
        </p>

        {/* Feature list */}
        <div className="surface rounded-2xl p-5 mb-8 text-left space-y-2.5">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-2.5 text-sm text-[#111111] dark:text-[#e8e7e4]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#346538] flex-shrink-0" />
              {f}
            </div>
          ))}
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
