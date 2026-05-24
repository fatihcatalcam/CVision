import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';

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
      toast.error(error.response?.data?.detail?.[0]?.msg || error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between bg-[#F7F6F3] p-12 w-[420px] shrink-0 border-r border-[#EAEAEA]">
        <span className="font-mono font-medium tracking-tight text-base text-[#111111]">CVision</span>
        <div>
          <blockquote className="font-serif text-2xl leading-snug tracking-tight text-[#111111] mb-6">
            "Know exactly where your CV stands."
          </blockquote>
          <p className="text-sm text-[#787774]">Used by career professionals across 14 industries.</p>
        </div>
        <p className="text-xs text-[#A09D9A]">© 2025 CVision</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-2xl tracking-tight text-[#111111] mb-1">Sign in</h1>
          <p className="text-sm text-[#787774] mb-8">Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#787774] uppercase tracking-wider">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-[#EAEAEA] rounded-xl h-12 px-4 text-[#111111] placeholder:text-[#A09D9A] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#EEF2F8] transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#787774] uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-xs text-[#1B3A6B] hover:text-[#111111] transition-colors">
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
                  className="w-full bg-white border border-[#EAEAEA] rounded-xl h-12 px-4 pr-12 text-[#111111] placeholder:text-[#A09D9A] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#EEF2F8] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#787774] hover:text-[#111111] transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl font-bold text-sm bg-[#111111] text-white hover:bg-[#2a2a2a] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
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

          <p className="mt-8 text-center text-sm text-[#787774]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#1B3A6B] hover:text-[#111111] font-semibold transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
