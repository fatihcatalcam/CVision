import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const inputCls =
  'w-full bg-white dark:bg-[#1c1c1a] border border-[#EAEAEA] dark:border-white/[0.07] rounded-xl h-12 px-4 text-[#111111] dark:text-[#e8e7e4] placeholder:text-[#A09D9A] dark:placeholder:text-[#6a6764] focus:outline-none focus:border-[#1B3A6B] dark:focus:border-[#4a7dd1] focus:ring-2 focus:ring-[#EEF2F8] dark:focus:ring-[#4a7dd1]/20 transition-all';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export function GoogleAuthButton() {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [pendingToken, setPendingToken] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (accessToken: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/google', { access_token: accessToken });
      if (res.data.status === 'needs_name') {
        setPendingToken(accessToken);
        setFullName(res.data.suggested_name ?? '');
        setShowModal(true);
      } else {
        login(res.data.access_token, res.data.user);
        toast.success(t('auth.login.successToast'));
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        t('auth.login.errorToast')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => handleGoogleSuccess(tokenResponse.access_token),
    onError: () => toast.error(t('auth.login.errorToast')),
    onNonOAuthError: () => { /* user closed popup — no-op */ },
    scope: 'openid email profile',
  });

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('/auth/google', {
        access_token: pendingToken,
        full_name: fullName.trim(),
      });
      login(res.data.access_token, res.data.user);
      toast.success(t('auth.register.successToast'));
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        t('auth.register.errorToast')
      );
      if (err.response?.status === 400) {
        setShowModal(false);
        setPendingToken('');
        setFullName('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setPendingToken('');
    setFullName('');
  };

  return (
    <>
      {/* Google button */}
      <button
        type="button"
        onClick={() => googleLogin()}
        disabled={isLoading}
        className="w-full h-12 rounded-xl border border-[#EAEAEA] dark:border-white/[0.07] bg-white dark:bg-[#1c1c1a] text-[#111111] dark:text-[#e8e7e4] hover:bg-[#f5f5f5] dark:hover:bg-[#252523] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-sm font-medium"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <GoogleIcon />
            {t('auth.google.continueWith')}
          </>
        )}
      </button>

      {/* Name collection modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
        >
          <div className="w-full max-w-md bg-white dark:bg-[#141413] rounded-2xl shadow-2xl border border-[#EAEAEA] dark:border-white/[0.07] p-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#111111] dark:text-[#e8e7e4]">
                  {t('auth.google.nameModal.title')}
                </h2>
                <p className="mt-1 text-sm text-[#787774] dark:text-[#908d89]">
                  {t('auth.google.nameModal.subtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1.5 rounded-lg text-[#A09D9A] hover:text-[#111111] dark:hover:text-[#e8e7e4] hover:bg-[#F5F5F5] dark:hover:bg-white/[0.06] transition-colors -mt-1 -mr-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="google-fullname"
                  className="text-xs font-semibold text-[#787774] dark:text-[#908d89] uppercase tracking-wider"
                >
                  {t('auth.register.fullName')}
                </label>
                <input
                  id="google-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('auth.google.nameModal.placeholder')}
                  required
                  minLength={2}
                  maxLength={150}
                  className={inputCls}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || fullName.trim().length < 2}
                className="w-full h-12 rounded-xl font-bold text-sm bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] hover:bg-[#2a2a2a] dark:hover:bg-[#d0cfcc] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('auth.google.nameModal.submit')}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="w-full text-xs text-[#787774] dark:text-[#908d89] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors py-1"
              >
                {t('auth.google.nameModal.back')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
