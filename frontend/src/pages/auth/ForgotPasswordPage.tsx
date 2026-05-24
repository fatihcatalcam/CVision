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
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA] dark:bg-[#111110] p-6">
      <div className="w-full max-w-sm">
        <button
          onClick={() => navigate('/login')}
          className="label-sm flex items-center gap-1 mb-8 hover:text-[#111111] transition-colors text-[#787774] bg-transparent border-0 cursor-pointer"
        >
          â† Back to sign in
        </button>
        <h1 className="font-sans text-2xl tracking-tight text-[#111111] dark:text-[#e8e7e4] mb-1">Reset your password</h1>
        <p className="text-sm text-[#787774] dark:text-[#908d89] mb-8">Enter your email and we will send you a reset link.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#787774] uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
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
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Code'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#787774]">
          Check your spam folder if you don't see the email.
        </p>
      </div>
    </div>
  );
}
