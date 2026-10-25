import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { claimPendingAnalysis } from '../../services/anonymousAnalysis';

const submitCls = 'w-full h-12 rounded-xl font-bold text-sm bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] hover:bg-[#2a2a2a] dark:hover:bg-[#d0cfcc] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2';

// The backend refuses a second code within a minute; the button waits as long.
const RESEND_COOLDOWN = 60;

// Error codes the API answers with, mapped to copy in the user's language.
const ERROR_KEYS: Record<string, string> = {
  invalid_code: 'auth.verifyEmail.invalidCode',
  code_expired: 'auth.verifyEmail.codeExpired',
  too_many_attempts: 'auth.verifyEmail.tooManyAttempts',
};

/**
 * An email signup lands here and cannot sign in until it enters the 6-digit
 * code it was mailed. A correct code signs the user in straight away, so this
 * screen replaces the auto sign-in that used to follow registration - and, like
 * it, carries any pending /try analysis into the new account.
 */
export function VerifyEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // A code was mailed on the way here (signup, or a login on an unverified
  // account), so the resend button starts out waiting.
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (!email) navigate('/register');
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/verify-email', { email, code });
      login(data.access_token, data.user);
      const claimedId = await claimPendingAnalysis();
      toast.success(t('auth.verifyEmail.successToast'));
      navigate(claimedId ? `/analysis/${claimedId}` : '/dashboard');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      const key = message ? ERROR_KEYS[message] : undefined;
      toast.error(t(key || 'auth.verifyEmail.errorToast'));
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setCooldown(RESEND_COOLDOWN);
    try {
      await api.post('/auth/resend-verification', { email });
      toast.success(t('auth.verifyEmail.resentToast'));
    } catch {
      toast.error(t('auth.verifyEmail.errorToast'));
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 4)) + c);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA] dark:bg-[#111110] p-6">
      <div className="w-full max-w-sm">
        <h1 className="font-sans text-2xl tracking-tight text-[#111111] dark:text-[#e8e7e4] mb-1">{t('auth.verifyEmail.title')}</h1>
        <p className="text-sm text-[#6B6A65] dark:text-[#908d89] mb-8">
          {t('auth.verifyEmail.codeInfo')}{' '}
          <span className="text-[#111111] dark:text-[#e8e7e4]">{maskedEmail}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            aria-label={t('auth.verifyEmail.codeLabel')}
            placeholder="000000"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full h-16 text-center text-3xl font-bold tracking-[0.5em] font-mono rounded-xl border outline-none transition-all bg-white dark:bg-[#1c1c1a] text-[#111111] dark:text-[#e8e7e4] placeholder:text-[#D9D8D5] dark:placeholder:text-[#3a3a38] border-[#EAEAEA] dark:border-white/[0.07] focus:border-[#1B3A6B] dark:focus:border-[#4a7dd1] focus:ring-2 focus:ring-[#EEF2F8] dark:focus:ring-[#4a7dd1]/20"
          />

          <button type="submit" disabled={isLoading || code.length !== 6} className={submitCls}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('auth.verifyEmail.verifyButton')}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#6B6A65] dark:text-[#908d89]">{t('auth.verifyEmail.spamNote')}</p>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className="text-sm text-[#1B3A6B] dark:text-[#4a7dd1] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors disabled:text-[#A09D9A] dark:disabled:text-[#6a6764] disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? t('auth.verifyEmail.resendIn', { seconds: cooldown }) : t('auth.verifyEmail.resend')}
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-[#6B6A65] dark:text-[#908d89]">
          {t('auth.verifyEmail.wrongEmail')}{' '}
          <Link to="/register" className="text-[#1B3A6B] dark:text-[#4a7dd1] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">
            {t('auth.verifyEmail.signUpAgain')}
          </Link>
        </p>
      </div>
    </div>
  );
}
