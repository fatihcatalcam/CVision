import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Target, ArrowRight, Zap, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const HomePage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-background)] overflow-hidden flex flex-col items-center">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-[-1]">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-[var(--color-primary)] opacity-10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-[var(--color-accent)] opacity-10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10 animate-in">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-[var(--color-primary-foreground)] font-bold shadow-lg shadow-[var(--color-primary)]/20">
            CV
          </div>
          <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]">CVision</span>
        </div>
        <div className="flex gap-4">
          {!isLoading && (isAuthenticated ? (
            <Link 
              to="/dashboard"
              className="px-6 py-2 rounded-full font-medium bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-primary)]/20 hover:shadow-[var(--color-primary)]/40 hover:-translate-y-0.5 transition-all"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link 
                to="/login"
                className="px-6 py-2 rounded-full font-medium text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors border border-transparent hover:border-[var(--color-primary)]/30 backdrop-blur-sm"
              >
                Log In
              </Link>
              <Link 
                to="/register"
                className="px-6 py-2 rounded-full font-medium bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-primary)]/20 hover:shadow-[var(--color-primary)]/40 hover:-translate-y-0.5 transition-all"
              >
                Get Started
              </Link>
            </>
          ))}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="w-full max-w-7xl mx-auto px-6 flex-1 flex flex-col items-center justify-center text-center mt-16 z-10 pb-24">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 text-[var(--color-primary)] text-sm font-semibold mb-8 animate-in slide-up" style={{ animationDelay: '0.1s' }}>
          <Zap size={16} />
          <span>Next-Generation AI for Tech Professionals</span>
        </div>

        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-4xl animate-in slide-up" style={{ animationDelay: '0.2s' }}>
          Stop Guessing.<br/>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] via-indigo-500 to-[var(--color-accent)]">
            Start Landing Interviews.
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-[var(--color-muted-foreground)] max-w-2xl mb-12 animate-in slide-up" style={{ animationDelay: '0.3s' }}>
          CVision uses advanced AI to analyze your resume against industry-specific domains, giving you the edge you need to stand out.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-in slide-up" style={{ animationDelay: '0.4s' }}>
          {!isLoading && (isAuthenticated ? (
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-8 py-4 rounded-full text-lg font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white shadow-xl shadow-[var(--color-primary)]/30 hover:shadow-[var(--color-primary)]/50 hover:-translate-y-1 transition-all"
            >
              Go to Dashboard
              <ArrowRight size={20} />
            </button>
          ) : (
            <Link 
              to="/register"
              className="flex items-center gap-2 px-8 py-4 rounded-full text-lg font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white shadow-xl shadow-[var(--color-primary)]/30 hover:shadow-[var(--color-primary)]/50 hover:-translate-y-1 transition-all"
            >
              Upload Your Resume
              <ArrowRight size={20} />
            </Link>
          ))}
          <a href="#features" className="flex items-center gap-2 px-8 py-4 rounded-full text-lg font-bold text-white border border-white/10 hover:bg-white/5 transition-colors">
            See How It Works
          </a>
        </div>

        {/* Features Glass Cards */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-32">
          {/* Feature 1 */}
          <div className="glass-card rounded-2xl p-8 text-left animate-in slide-up group hover:-translate-y-1 transition-all duration-300" style={{ animationDelay: '0.5s' }}>
            <div className="w-14 h-14 rounded-xl bg-[var(--color-primary)]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Brain className="text-[var(--color-primary)]" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">AI Analysis Engine</h3>
            <p className="text-[var(--color-muted-foreground)] leading-relaxed">
              Deep semantic evaluation of your skills and experience tailored to modern tech stacks.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card rounded-2xl p-8 text-left animate-in slide-up group hover:-translate-y-1 transition-all duration-300" style={{ animationDelay: '0.6s' }}>
            <div className="w-14 h-14 rounded-xl bg-[var(--color-accent)]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Target className="text-[var(--color-accent)]" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Domain Intelligence</h3>
            <p className="text-[var(--color-muted-foreground)] leading-relaxed">
              Domain-specific keyword matching ensuring you hit the right ATS target for your exact role.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card rounded-2xl p-8 text-left animate-in slide-up group hover:-translate-y-1 transition-all duration-300" style={{ animationDelay: '0.7s' }}>
            <div className="w-14 h-14 rounded-xl bg-[var(--color-success)]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Trophy className="text-[var(--color-success)]" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Actionable Insights</h3>
            <p className="text-[var(--color-muted-foreground)] leading-relaxed">
              Clear scoring with direct, practical recommendations to elevate your resume impact.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
