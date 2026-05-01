import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { AnalysisPage } from './pages/analysis/AnalysisPage';
import { AdminPage } from './pages/admin/AdminPage';
import { HomePage } from './pages/home/HomePage';
import { PricingPage } from './pages/pricing/PricingPage';
import { SuccessPage } from './pages/payment/SuccessPage';
import { CancelPage } from './pages/payment/CancelPage';
import { HistoryPage } from './pages/history/HistoryPage';
import { SettingsPage } from './pages/settings/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Background mesh gradient */}
        <div className="fixed inset-0 z-[-1] mesh-bg" />

        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/analysis/:id" element={<AnalysisPage />} />
            <Route path="/hq-portal" element={<AdminPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/payment/success" element={<SuccessPage />} />
            <Route path="/payment/cancel" element={<CancelPage />} />
          </Route>

          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
