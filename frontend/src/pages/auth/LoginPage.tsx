import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader2, Eye, EyeOff, ArrowRight, ArrowLeft, Brain, Target, Trophy } from 'lucide-react';

const BULLETS = [
  { icon: Brain, text: 'AI-powered CV analysis in seconds' },
  { icon: Target, text: 'ATS compatibility scoring' },
  { icon: Trophy, text: 'Actionable improvement insights' },
];

export function LoginPage() {
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
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      if (detail === 'EMAIL_NOT_VERIFIED') {
        toast.error('Please verify your email before signing in.');
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      toast.error(Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : detail || 'Email or password is incorrect.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-[var(--color-background)] to-violet-950/40" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.8) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="CVision" className="h-9 w-auto object-contain" />
              <span className="text-xl font-black tracking-tight text-white">
                CVision<span className="text-indigo-400">.</span>
              </span>
            </div>
            <Link to="/" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Home
            </Link>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Your AI-powered<br />
              <span className="gradient-text">career advantage.</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              Analyze your resume, uncover gaps, and get actionable feedback from advanced AI — in under 30 seconds.
            </p>
          </div>

          <div className="space-y-4">
            {BULLETS.map((b) => (
              <div key={b.text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-sm text-zinc-300">{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative score card */}
        <div className="relative z-10">
          <div className="glass-card rounded-2xl p-5 border border-indigo-500/15">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#1e1e2e" strokeWidth="6" />
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#6366f1" strokeWidth="6"
                    strokeDasharray="138" strokeDashoffset="28" strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">80%</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Resume Score</p>
                <p className="text-zinc-500 text-xs mt-0.5">3 improvements suggested</p>
              </div>
              <div className="ml-auto">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">ATS Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md animate-in slide-up">

          {/* Mobile logo */}
          <div className="flex items-center justify-between mb-10 lg:hidden">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="CVision" className="h-8 w-auto object-contain" />
              <span className="text-lg font-black text-white">CVision<span className="text-indigo-400">.</span></span>
            </div>
            <Link to="/" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Home
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">Welcome back</h1>
            <p className="text-zinc-500 text-sm">Sign in to your CVision account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[rgba(15,15,24,0.8)] border border-[var(--color-card-border)] rounded-xl h-12 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
