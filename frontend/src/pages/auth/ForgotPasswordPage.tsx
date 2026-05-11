import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, KeyRound } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Reset code sent to your email!');
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      toast.error(detail || 'Failed to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-in slide-up">

        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="CVision" className="h-8 w-auto object-contain" />
            <span className="text-lg font-black text-white">CVision<span className="text-indigo-400">.</span></span>
          </div>
          <Link to="/login" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Sign In
          </Link>
        </div>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-rose-600/20 border border-violet-500/20 flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-violet-400" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white mb-2">Forgot your password?</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Enter your email address and we'll send you a reset code.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full bg-[rgba(15,15,24,0.8)] border border-[var(--color-card-border)] rounded-xl h-12 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Code'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-700">
          Check your spam folder if you don't see the email.
        </p>
      </div>
    </div>
  );
}
