import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader2, Eye, EyeOff, Check, X } from 'lucide-react';

const submitCls = 'w-full h-12 rounded-xl font-bold text-sm bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] hover:bg-[#2a2a2a] dark:hover:bg-[#d0cfcc] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2';

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
            {c.pass ? <Check className="w-3 h-3 text-[#346538] flex-shrink-0" /> : <X className="w-3 h-3 text-[#A09D9A] dark:text-[#6a6764] flex-shrink-0" />}
            <span className={`text-[10px] ${c.pass ? 'text-[#787774] dark:text-[#908d89]' : 'text-[#A09D9A] dark:text-[#6a6764]'}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Step = 'code' | 'password';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('code');
  const [chars, setChars] = useState(['', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  useEffect(() => {
    if (!email) navigate('/forgot-password');
  }, [email, navigate]);

  useEffect(() => {
    if (step === 'code') inputRefs.current[0]?.focus();
  }, [step]);

  const handleCharChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.slice(0, 5);
      const newChars = [...chars];
      for (let i = 0; i < 5; i++) newChars[i] = pasted[i] || '';
      setChars(newChars);
      inputRefs.current[Math.min(pasted.length, 4)]?.focus();
      return;
    }
    const newChars = [...chars];
    newChars[index] = value;
    setChars(newChars);
    if (value && index < 4) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !chars[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = chars.join('');
    if (code.length !== 5) { toast.error(t('auth.resetPassword.codeError')); return; }
    setIsLoading(true);
    try {
      await api.post('/auth/verify-reset-code', { email, code });
      toast.success(t('auth.resetPassword.codeSuccessToast'));
      setStep('password');
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      toast.error(Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : detail || t('auth.resetPassword.codeErrorToast'));
      setChars(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = chars.join('');

    // Name the exact failing password rules in the user's language before the
    // request, instead of surfacing the backend's English message. Mirrors the
    // backend rules in app/schemas/user.py and RegisterPage.
    const missing: string[] = [];
    if (newPassword.length < 8) missing.push(t('auth.register.reqLength'));
    if (!/[A-Z]/.test(newPassword)) missing.push(t('auth.register.reqUpper'));
    if (!/[a-z]/.test(newPassword)) missing.push(t('auth.register.reqLower'));
    if (!/\d/.test(newPassword)) missing.push(t('auth.register.reqNumber'));
    if (missing.length > 0) {
      toast.error(`${t('auth.register.passwordMissing')} ${missing.join(', ')}`);
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code, new_password: newPassword });
      toast.success(t('auth.resetPassword.updateSuccessToast'));
      navigate('/login');
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      toast.error(Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : detail || t('auth.resetPassword.updateErrorToast'));
    } finally {
      setIsLoading(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 4)) + c)
    : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA] dark:bg-[#111110] p-6">
      <div className="w-full max-w-sm">
        <h1 className="font-sans text-2xl tracking-tight text-[#111111] dark:text-[#e8e7e4] mb-1">{t('auth.resetPassword.title')}</h1>
        <p className="text-sm text-[#787774] dark:text-[#908d89] mb-8">{t('auth.resetPassword.subtitle')}</p>

        {step === 'code' ? (
          <>
            <div className="text-center mb-8">
              <p className="text-[#787774] dark:text-[#908d89] text-sm leading-relaxed">
                {t('auth.resetPassword.codeInfo')}<br />
                <span className="text-[#111111] dark:text-[#e8e7e4]">{maskedEmail}</span>
              </p>
              <p className="text-amber-500/80 text-xs mt-2">{t('auth.resetPassword.codeCaseSensitive')}</p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="flex gap-3 justify-center">
                {chars.map((char, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    maxLength={5}
                    value={char}
                    onChange={e => handleCharChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={`w-14 h-16 text-center text-2xl font-black rounded-xl border transition-all outline-none font-mono
                      bg-white dark:bg-[#1c1c1a] text-[#111111] dark:text-[#e8e7e4]
                      ${char
                        ? 'border-[#1B3A6B] dark:border-[#4a7dd1] ring-2 ring-[#EEF2F8] dark:ring-[#4a7dd1]/20'
                        : 'border-[#EAEAEA] dark:border-white/[0.07] focus:border-[#1B3A6B] dark:focus:border-[#4a7dd1] focus:ring-2 focus:ring-[#EEF2F8] dark:focus:ring-[#4a7dd1]/20'
                      }`}
                  />
                ))}
              </div>

              <button type="submit" disabled={isLoading || chars.join('').length !== 5} className={submitCls}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('auth.resetPassword.verifyButton')}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <p className="text-[#787774] dark:text-[#908d89] text-sm">{t('auth.resetPassword.newPassword')}</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#787774] dark:text-[#908d89] uppercase tracking-wider">{t('auth.resetPassword.newPassword')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.resetPassword.passwordPlaceholder')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-white dark:bg-[#1c1c1a] border border-[#EAEAEA] dark:border-white/[0.07] rounded-xl h-12 px-4 pr-12 text-[#111111] dark:text-[#e8e7e4] placeholder:text-[#A09D9A] dark:placeholder:text-[#6a6764] focus:outline-none focus:border-[#1B3A6B] dark:focus:border-[#4a7dd1] focus:ring-2 focus:ring-[#EEF2F8] dark:focus:ring-[#4a7dd1]/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#787774] dark:text-[#908d89] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrength password={newPassword} />
              </div>

              <button type="submit" disabled={isLoading || newPassword.length < 8} className={submitCls}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('auth.resetPassword.updateButton')}
              </button>
            </form>
          </>
        )}

        <p className="mt-8 text-center text-xs text-[#787774] dark:text-[#908d89]">
          {t('auth.resetPassword.havingTrouble')}{' '}
          <Link to="/forgot-password" className="text-[#1B3A6B] dark:text-[#4a7dd1] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">
            {t('auth.resetPassword.requestNewCode')}
          </Link>
        </p>
      </div>
    </div>
  );
}
