import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Mail, ArrowLeft, RefreshCw } from 'lucide-react';

export function VerifyEmailPage() {
  const [digits, setDigits] = useState(['', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const email = searchParams.get('email') || '';

  useEffect(() => {
    if (!email) {
      navigate('/register');
      return;
    }
    inputRefs.current[0]?.focus();
  }, [email, navigate]);

  // Countdown for resend button
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleDigitChange = (index: number, value: string) => {
    // Handle paste of full code
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 5);
      const newDigits = [...digits];
      for (let i = 0; i < 5; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 4);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 5) {
      toast.error('Lütfen 5 haneli kodu girin');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/verify-email', { email, code });
      login(response.data.access_token, response.data.user);
      toast.success('E-posta doğrulandı! Hoş geldiniz.');
      navigate('/dashboard');
    } catch (error: any) {
      const detail = error.response?.data?.detail || 'Doğrulama başarısız';
      toast.error(detail);
      // Clear digits on wrong code
      setDigits(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setIsResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      toast.success('Yeni doğrulama kodu gönderildi!');
      setCountdown(60);
      setCanResend(false);
      setDigits(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      toast.error('Kod gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsResending(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 4)) + c)
    : '';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-in slide-up">

        {/* Logo */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="CVision" className="h-8 w-auto object-contain" />
            <span className="text-lg font-black text-white">CVision<span className="text-indigo-400">.</span></span>
          </div>
          <Link to="/register" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Geri
          </Link>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center">
            <Mail className="w-8 h-8 text-indigo-400" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white mb-2">E-postanı doğrula</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            <span className="text-zinc-400">{maskedEmail}</span> adresine<br />
            5 haneli doğrulama kodu gönderdik.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 5-digit input */}
          <div className="flex gap-3 justify-center">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={digit}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-14 h-16 text-center text-2xl font-black rounded-xl border transition-all outline-none
                  bg-[rgba(15,15,24,0.8)] text-white
                  ${digit
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'border-[var(--color-card-border)] focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15'
                  }`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || digits.join('').length !== 5}
            className="w-full h-12 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Doğrula ve Giriş Yap'}
          </button>
        </form>

        {/* Resend */}
        <div className="mt-6 text-center">
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors mx-auto disabled:opacity-60"
            >
              {isResending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5" />
              }
              Kodu tekrar gönder
            </button>
          ) : (
            <p className="text-sm text-zinc-600">
              Kodu tekrar gönder — <span className="text-zinc-500 tabular-nums">{countdown}s</span>
            </p>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-zinc-700">
          Mail gelmediyse spam klasörünü kontrol et.
        </p>
      </div>
    </div>
  );
}
