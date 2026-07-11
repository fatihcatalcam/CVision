import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
import { claimPendingAnalysis } from '../../services/anonymousAnalysis';

const inputCls = 'w-full bg-white dark:bg-[#1c1c1a] border border-[#EAEAEA] dark:border-white/[0.07] rounded-xl h-12 px-4 text-[#111111] dark:text-[#e8e7e4] placeholder:text-[#A09D9A] dark:placeholder:text-[#6a6764] focus:outline-none focus:border-[#1B3A6B] dark:focus:border-[#4a7dd1] focus:ring-2 focus:ring-[#EEF2F8] dark:focus:ring-[#4a7dd1]/20 transition-all';

export function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.access_token, response.data.user);
      const claimedId = await claimPendingAnalysis();
      toast.success(t('auth.login.successToast'));
      navigate(claimedId ? `/analysis/${claimedId}` : '/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.detail?.[0]?.msg || error.response?.data?.detail || t('auth.login.errorToast'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#111110] relative">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between bg-[#F7F6F3] dark:bg-[#1a1a18] p-12 w-[420px] shrink-0 border-r border-[#EAEAEA] dark:border-white/[0.07] animate-in">
        <span className="font-mono font-medium tracking-tight text-base text-[#111111] dark:text-[#e8e7e4]">CVision</span>
        <div>
          <blockquote className="font-sans text-2xl leading-snug tracking-tight text-[#111111] dark:text-[#e8e7e4] mb-6">
            "{t('auth.tagline')}"
          </blockquote>
          <p className="text-sm text-[#787774] dark:text-[#908d89]">{t('auth.usedBy')}</p>
        </div>
        <p className="text-xs text-[#A09D9A] dark:text-[#6a6764]">{t('common.copyright')}</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm stagger-list">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-[#787774] dark:text-[#908d89] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors mb-8"
          >
            {t('auth.backToHome')}
          </button>
          <h1 className="font-sans text-2xl tracking-tight text-[#111111] dark:text-[#e8e7e4] mb-1">{t('auth.login.title')}</h1>
          <p className="text-sm text-[#787774] dark:text-[#908d89] mb-8">{t('auth.login.subtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#787774] dark:text-[#908d89] uppercase tracking-wider">{t('auth.login.email')}</label>
              <input
                type="email"
                placeholder={t('auth.login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputCls}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#787774] dark:text-[#908d89] uppercase tracking-wider">{t('auth.login.password')}</label>
                <Link to="/forgot-password" className="text-xs text-[#1B3A6B] dark:text-[#4a7dd1] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">
                  {t('auth.login.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputCls} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#787774] dark:text-[#908d89] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl font-bold text-sm bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] hover:bg-[#2a2a2a] dark:hover:bg-[#d0cfcc] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>{t('auth.login.submitButton')} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Google OAuth */}
          <div className="mt-6">
            <div className="relative flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#EAEAEA] dark:bg-white/[0.07]" />
              <span className="text-xs text-[#A09D9A] dark:text-[#6a6764] font-medium">{t('common.or')}</span>
              <div className="flex-1 h-px bg-[#EAEAEA] dark:bg-white/[0.07]" />
            </div>
            <GoogleAuthButton />
          </div>

          <p className="mt-8 text-center text-sm text-[#787774] dark:text-[#908d89]">
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" className="text-[#1B3A6B] dark:text-[#4a7dd1] hover:text-[#111111] dark:hover:text-[#e8e7e4] font-semibold transition-colors">
              {t('auth.login.createFree')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
