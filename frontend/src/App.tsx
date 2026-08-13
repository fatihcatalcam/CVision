import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/ProtectedRoute';
// HomePage is the landing route ("/") and the LCP page — keep it eager so the
// first paint has no lazy-chunk waterfall. Every other route is code-split so
// heavy, auth-only screens (admin + recharts, analysis + PDF viewer, match)
// never ship in the initial bundle a mobile visitor downloads.
import { HomePage } from './pages/home/HomePage';

const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AnalysisPage = lazy(() => import('./pages/analysis/AnalysisPage').then(m => ({ default: m.AnalysisPage })));
const AdminPage = lazy(() => import('./pages/admin/AdminPage').then(m => ({ default: m.AdminPage })));
const PricingPage = lazy(() => import('./pages/pricing/PricingPage').then(m => ({ default: m.PricingPage })));
const SuccessPage = lazy(() => import('./pages/payment/SuccessPage').then(m => ({ default: m.SuccessPage })));
const CancelPage = lazy(() => import('./pages/payment/CancelPage').then(m => ({ default: m.CancelPage })));
const HistoryPage = lazy(() => import('./pages/history/HistoryPage').then(m => ({ default: m.HistoryPage })));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/legal/TermsPage').then(m => ({ default: m.TermsPage })));
const AboutPage = lazy(() => import('./pages/about/AboutPage').then(m => ({ default: m.AboutPage })));
const HowAtsWorksPage = lazy(() => import('./pages/guide/HowAtsWorksPage').then(m => ({ default: m.HowAtsWorksPage })));
const MatchPage = lazy(() => import('./pages/match/MatchPage').then(m => ({ default: m.MatchPage })));
const TryPage = lazy(() => import('./pages/try/TryPage').then(m => ({ default: m.TryPage })));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#EAEAEA] border-t-[#111111] rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/analysis/:id" element={<AnalysisPage />} />
              <Route path="/hq-portal" element={<AdminPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/payment/success" element={<SuccessPage />} />
              <Route path="/payment/cancel" element={<CancelPage />} />
              <Route path="/match" element={<MatchPage />} />
            </Route>

            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-ats-works" element={<HowAtsWorksPage />} />
            <Route path="/try" element={<TryPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            {/* A real 404 rather than a redirect into a protected route.
                See NotFoundPage: the old catch-all sent a logged-out visitor
                with a stale link to /dashboard and from there to /login, with
                nothing explaining why. */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
