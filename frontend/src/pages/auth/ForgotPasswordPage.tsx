import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA] p-6">
      <div className="w-full max-w-sm">
        <button
          onClick={() => navigate('/login')}
          className="label-sm flex items-center gap-1 mb-8 hover:text-[#111111] transition-colors text-[#787774] bg-transparent border-0 cursor-pointer"
        >
          ← Back to sign in
        </button>
        <h1 className="font-serif text-2xl tracking-tight text-[#111111] mb-1">Reset your password</h1>
        <p className="text-sm text-[#787774] mb-8">Enter your email and we will send you a reset link.</p>

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
              className="w-full bg-white border border-[#EAEAEA] rounded-xl h-12 px-4 text-[#111111] placeholder:text-[#A09D9A] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#EEF2F8] transition-all"
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
