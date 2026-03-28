import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      {/* Background ambient gradient for premium look */}
      <div className="fixed inset-0 z-[-1] bg-[var(--color-background)]">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[var(--color-primary)] opacity-[0.05] rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[var(--color-accent)] opacity-[0.05] rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Content wrapper */}
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="glass-card p-12 rounded-2xl max-w-xl text-center animate-in slide-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent mb-4">
            CVision Frontend Ready
          </h1>
          <p className="text-[var(--color-muted)] text-lg mb-8">
            React + Vite + Tailwind CSS v4 environment successfully configured and running with dark mode glassmorphism styles.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-6 py-3 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium transition-colors shadow-lg shadow-blue-500/20">
              Get Started
            </button>
            <button className="px-6 py-3 rounded-lg border border-[var(--color-card-border)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] text-white font-medium transition-colors">
              Documentation
            </button>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
