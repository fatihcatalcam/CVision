import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';

import { AnalysisPage } from './pages/analysis/AnalysisPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Background ambient gradient for premium look */}
        <div className="fixed inset-0 z-[-1] bg-[var(--color-background)]">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[var(--color-primary)] opacity-[0.05] rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[var(--color-accent)] opacity-[0.05] rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Route Configuration */}
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/analysis/:id" element={<AnalysisPage />} />
          </Route>
          
          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
