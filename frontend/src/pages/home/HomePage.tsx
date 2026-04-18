import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Target, ArrowRight, Zap, Trophy, ChevronRight, Star, TrendingUp, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const STATS = [
  { value: '14,000+', label: 'CV Analyzed' },
  { value: '96%', label: 'Match Accuracy' },
  { value: '2x', label: 'Interview Rate' },
  { value: '4.9★', label: 'User Rating' },
];

const FEATURES = [
  {
    icon: Brain,
    color: 'indigo',
    gradient: 'from-indigo-500/20 to-indigo-500/5',
    border: 'border-indigo-500/20',
    iconBg: 'bg-indigo-500/15',
    iconColor: 'text-indigo-400',
    title: 'AI Analysis Engine',
    desc: 'Deep semantic evaluation of your skills and experience tailored to modern tech stacks.',
    badge: 'Powered by GPT-4',
  },
  {
    icon: Target,
    color: 'violet',
    gradient: 'from-violet-500/20 to-violet-500/5',
    border: 'border-violet-500/20',
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-400',
    title: 'Domain Intelligence',
    desc: 'Domain-specific keyword matching ensuring you hit the right ATS target for your exact role.',
    badge: '14+ Industries',
  },
  {
    icon: Trophy,
    color: 'emerald',
    gradient: 'from-emerald-500/20 to-emerald-500/5',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    title: 'Actionable Insights',
    desc: 'Clear scoring with direct, practical recommendations to elevate your resume impact.',
    badge: 'Instant Results',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Upload Your CV', desc: 'Drop your PDF or TXT resume — we handle the rest.', icon: '📄' },
  { step: '02', title: 'Choose Target Role', desc: 'Select the domain and job type you\'re applying for.', icon: '🎯' },
  { step: '03', title: 'Get AI Insights', desc: 'Receive a detailed score, strengths, and improvement tips.', icon: '✨' },
];

export const HomePage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-background)] overflow-hidden flex flex-col items-center">

      {/* Dynamic cursor-follow background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[120px] transition-all duration-1000 ease-out"
          style={{
            background: 'radial-gradient(circle, #6366f1, transparent)',
            left: `calc(${mousePos.x}% - 300px)`,
            top: `calc(${mousePos.y}% - 300px)`,
          }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600 opacity-[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600 opacity-[0.04] rounded-full blur-[80px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-5 flex justify-between items-center z-10">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="CVision" className="h-9 w-auto object-contain" />
          <span className="text-xl font-black tracking-tight text-white">
            CVision<span className="text-indigo-400">.</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</a>
          <a href="#how" className="text-sm text-zinc-400 hover:text-white transition-colors">How it works</a>
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && (isAuthenticated ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
            >
              Dashboard <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-5 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
              >
                Get Started <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <main ref={heroRef} className="w-full max-w-7xl mx-auto px-6 flex-1 flex flex-col items-center justify-center text-center mt-12 z-10 pb-8">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-indigo-300 text-xs font-semibold mb-8 animate-in">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Next-Generation AI for Tech Professionals
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-6 leading-[1.05] max-w-4xl slide-up">
          Stop Guessing.{' '}
          <br className="hidden sm:block" />
          <span className="gradient-text">
            Start Landing Interviews.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed slide-up" style={{ animationDelay: '0.1s' }}>
          CVision uses advanced AI to analyze your resume against industry-specific domains,
          giving you the edge you need to stand out from the crowd.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 slide-up" style={{ animationDelay: '0.2s' }}>
          {!isLoading && (isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 transition-all"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <Link
              to="/register"
              className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 transition-all"
            >
              Analyze Your Resume Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
          <a
            href="#how"
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-semibold text-zinc-300 border border-white/10 hover:bg-white/5 hover:border-white/15 transition-all"
          >
            <Zap className="w-4 h-4 text-indigo-400" />
            See How It Works
          </a>
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-2 mb-20 slide-up" style={{ animationDelay: '0.25s' }}>
          <div className="flex -space-x-2">
            {['I', 'A', 'M', 'K'].map((letter, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-[var(--color-background)] flex items-center justify-center text-xs font-bold text-white"
                style={{ background: ['#6366f1','#8b5cf6','#3b82f6','#10b981'][i] }}
              >
                {letter}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 ml-1">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
          </div>
          <span className="text-xs text-zinc-500">Trusted by <span className="text-zinc-300 font-medium">14,000+</span> professionals</span>
        </div>

        {/* Stats bar */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-24 slide-up" style={{ animationDelay: '0.3s' }}>
          {STATS.map((stat) => (
            <div key={stat.label} className="glass-card rounded-2xl p-5 text-center border border-white/5 hover:border-indigo-500/20 transition-all duration-300 group">
              <p className="text-2xl font-black text-white stat-number group-hover:text-indigo-300 transition-colors">{stat.value}</p>
              <p className="text-xs text-zinc-500 mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div id="features" className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 mb-24">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`relative glass-card rounded-2xl p-7 text-left border ${f.border} bg-gradient-to-b ${f.gradient} hover:-translate-y-2 transition-all duration-300 group slide-up`}
              style={{ animationDelay: `${0.4 + i * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-xl ${f.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <f.icon className={`w-6 h-6 ${f.iconColor}`} />
              </div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${f.iconBg} ${f.iconColor} mb-3`}>
                {f.badge}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div id="how" className="w-full mb-24">
          <div className="text-center mb-12">
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-3xl font-black text-white">How CVision Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative flex flex-col items-center text-center p-6">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-indigo-500/30 to-transparent" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl mb-4 relative">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">
                    {step.step.slice(1)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="w-full glass-card rounded-3xl p-10 md:p-16 text-center border border-indigo-500/15 bg-gradient-to-b from-indigo-950/30 to-transparent relative overflow-hidden mb-8">
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-indigo-600 blur-[80px] rounded-full" />
          </div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-5">
              <TrendingUp className="w-3.5 h-3.5" /> 2x more interviews on average
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Ready to Land Your Dream Job?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
              Join thousands of professionals who've boosted their interview rate with CVision.
            </p>
            {!isLoading && !isAuthenticated && (
              <Link
                to="/register"
                className="inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 transition-all"
              >
                Start Free Analysis
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t border-white/5 text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Secure & Private · Your data is never shared</span>
          </div>
          <span>© 2026 CVision. All rights reserved.</span>
        </footer>
      </main>
    </div>
  );
};
