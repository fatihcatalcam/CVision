import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success(t('auth.forgotPassword.successToast'));
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      toast.error(detail || t('auth.forgotPassword.errorToast'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA] dark:bg-[#111110] p-6">
      <div className="w-full max-w-sm">
        <button
          onClick={() => navigate('/login')}
          className="label-sm flex items-center gap-1 mb-8 hover:text-[#111111] transition-colors text-[#787774] bg-transparent border-0 cursor-pointer"
        >
          {t('auth.forgotPassword.backToSignIn')}
        </button>
        <h1 className="font-sans text-2xl tracking-tight text-[#111111] dark:text-[#e8e7e4] mb-1">{t('auth.forgotPassword.title')}</h1>
        <p className="text-sm text-[#787774] dark:text-[#908d89] mb-8">{t('auth.forgotPassword.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#787774] uppercase tracking-wider">{t('auth.forgotPassword.email')}</label>
            <input
              type="email"
              placeholder={t('auth.forgotPassword.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full bg-white dark:bg-[#1c1c1a] border border-[#EAEAEA] dark:border-white/[0.07] rounded-xl h-12 px-4 text-[#111111] dark:text-[#e8e7e4] placeholder:text-[#A09D9A] dark:placeholder:text-[#6a6764] focus:outline-none focus:border-[#1B3A6B] dark:focus:border-[#4a7dd1] focus:ring-2 focus:ring-[#EEF2F8] dark:focus:ring-[#4a7dd1]/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl font-bold text-sm bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] hover:bg-[#2a2a2a] dark:hover:bg-[#d0cfcc] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('auth.forgotPassword.submitButton')}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#787774]">
          {t('auth.forgotPassword.spamNote')}
        </p>
      </div>
    </div>
  );
}
