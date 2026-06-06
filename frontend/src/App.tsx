import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { AnalysisPage } from './pages/analysis/AnalysisPage';
import { AdminPage } from './pages/admin/AdminPage';
import { HomePage } from './pages/home/HomePage';
import { PricingPage } from './pages/pricing/PricingPage';
import { SuccessPage } from './pages/payment/SuccessPage';
import { CancelPage } from './pages/payment/CancelPage';
import { HistoryPage } from './pages/history/HistoryPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { PrivacyPage } from './pages/legal/PrivacyPage';
import { TermsPage } from './pages/legal/TermsPage';
import { AboutPage } from './pages/about/AboutPage';
import { MatchPage } from './pages/match/MatchPage';

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>

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
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
