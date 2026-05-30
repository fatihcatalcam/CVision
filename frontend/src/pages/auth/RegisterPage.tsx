import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader2, Eye, EyeOff, ArrowRight, Check, X } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';

const inputCls = 'w-full bg-white dark:bg-[#1c1c1a] border border-[#EAEAEA] dark:border-white/[0.07] rounded-xl h-12 px-4 text-[#111111] dark:text-[#e8e7e4] placeholder:text-[#A09D9A] dark:placeholder:text-[#6a6764] focus:outline-none focus:border-[#1B3A6B] dark:focus:border-[#4a7dd1] focus:ring-2 focus:ring-[#EEF2F8] dark:focus:ring-[#4a7dd1]/20 transition-all';

function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation();
  const checks = [
    { label: t('auth.register.reqLength'), pass: password.length >= 8 },
    { label: t('auth.register.reqUpper'), pass: /[A-Z]/.test(password) },
    { label: t('auth.register.reqLower'), pass: /[a-z]/.test(password) },
    { label: t('auth.register.reqNumber'), pass: /\d/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['', 'bg-red-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500'];
  const labels = [
    '',
    t('auth.register.strengthWeakPwd'),
    t('auth.register.strengthFairPwd'),
    t('auth.register.strengthGoodPwd'),
    t('auth.register.strengthStrongPwd'),
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-[#EAEAEA] dark:bg-white/[0.07]'}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1.5">
            {c.pass
              ? <Check className="w-3 h-3 text-[#346538] flex-shrink-0" />
              : <X className="w-3 h-3 text-[#A09D9A] dark:text-[#6a6764] flex-shrink-0" />}
            <span className={`text-[10px] ${c.pass ? 'text-[#787774] dark:text-[#908d89]' : 'text-[#A09D9A] dark:text-[#6a6764]'}`}>{c.label}</span>
          </div>
        ))}
      </div>
      {score > 0 && (
        <p className={`text-[10px] font-bold ${colors[score].replace('bg-', 'text-')}`}>{labels[score]}</p>
      )}
    </div>
  );
}

export function RegisterPage() {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/register', { full_name: fullName, email, password });
      toast.success(t('auth.register.successToast'));
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.detail?.[0]?.msg || error.response?.data?.detail || t('auth.register.errorToast'));
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
            "{t('auth.taglineRegister')}"
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
          <h1 className="font-sans text-2xl tracking-tight text-[#111111] dark:text-[#e8e7e4] mb-1">{t('auth.register.title')}</h1>
          <p className="text-sm text-[#787774] dark:text-[#908d89] mb-8">{t('auth.register.subtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#787774] dark:text-[#908d89] uppercase tracking-wider">{t('auth.register.fullName')}</label>
              <input
                type="text"
                placeholder={t('auth.register.fullNamePlaceholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
                className={inputCls}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#787774] dark:text-[#908d89] uppercase tracking-wider">{t('auth.register.email')}</label>
              <input
                type="email"
                placeholder={t('auth.register.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputCls}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#787774] dark:text-[#908d89] uppercase tracking-wider">{t('auth.register.password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.register.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
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
              <PasswordStrength password={password} />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl font-bold text-sm bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] hover:bg-[#2a2a2a] dark:hover:bg-[#d0cfcc] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>{t('auth.register.submitButton')} <ArrowRight className="w-4 h-4" /></>
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
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login" className="text-[#1B3A6B] dark:text-[#4a7dd1] hover:text-[#111111] dark:hover:text-[#e8e7e4] font-semibold transition-colors">
              {t('auth.register.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
