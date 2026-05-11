import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, ShieldCheck, Eye, EyeOff, Check, X } from 'lucide-react';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', pass: /[a-z]/.test(password) },
    { label: 'Number', pass: /\d/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['', 'bg-red-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-zinc-800'}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1.5">
            {c.pass ? <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" /> : <X className="w-3 h-3 text-zinc-600 flex-shrink-0" />}
            <span className={`text-[10px] ${c.pass ? 'text-zinc-400' : 'text-zinc-600'}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Step = 'code' | 'password';

export function ResetPasswordPage() {
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
    if (code.length !== 5) {
      toast.error('Please enter the full 5-character code.');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/verify-reset-code', { email, code });
      toast.success('Code verified! Set your new password.');
      setStep('password');
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      toast.error(Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : detail || 'Invalid code. Please try again.');
      setChars(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = chars.join('');
    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code, new_password: newPassword });
      toast.success('Password updated! You can now sign in.');
      navigate('/login');
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      toast.error(Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : detail || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 4)) + c)
    : '';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-in slide-up">

        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="CVision" className="h-8 w-auto object-contain" />
            <span className="text-lg font-black text-white">CVision<span className="text-indigo-400">.</span></span>
          </div>
          <Link to="/forgot-password" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </div>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-rose-600/20 border border-violet-500/20 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-violet-400" />
          </div>
        </div>

        {step === 'code' ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black text-white mb-2">Enter Reset Code</h1>
              <p className="text-zinc-500 text-sm leading-relaxed">
                We sent a 5-character reset code to<br />
                <span className="text-zinc-400">{maskedEmail}</span>
              </p>
              <p className="text-amber-500/80 text-xs mt-2">⚠ Code is case-sensitive</p>
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
                    className={`w-14 h-16 text-center text-2xl font-black rounded-xl border transition-all outline-none
                      bg-[rgba(15,15,24,0.8)] text-white font-mono
                      ${char
                        ? 'border-violet-500 ring-2 ring-violet-500/20'
                        : 'border-[var(--color-card-border)] focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15'
                      }`}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading || chars.join('').length !== 5}
                className="w-full h-12 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-rose-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black text-white mb-2">Set New Password</h1>
              <p className="text-zinc-500 text-sm">Choose a strong password.</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-[rgba(15,15,24,0.8)] border border-[var(--color-card-border)] rounded-xl h-12 px-4 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrength password={newPassword} />
              </div>

              <button
                type="submit"
                disabled={isLoading || newPassword.length < 8}
                className="w-full h-12 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-rose-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
              </button>
            </form>
          </>
        )}

        <p className="mt-8 text-center text-xs text-zinc-700">
          Having trouble?{' '}
          <Link to="/forgot-password" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Request a new code
          </Link>
        </p>
      </div>
    </div>
  );
}
