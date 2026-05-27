import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const inputCls =
  'w-full bg-white dark:bg-[#1c1c1a] border border-[#EAEAEA] dark:border-white/[0.07] rounded-xl h-12 px-4 text-[#111111] dark:text-[#e8e7e4] placeholder:text-[#A09D9A] dark:placeholder:text-[#6a6764] focus:outline-none focus:border-[#1B3A6B] dark:focus:border-[#4a7dd1] focus:ring-2 focus:ring-[#EEF2F8] dark:focus:ring-[#4a7dd1]/20 transition-all';

type Step = 'button' | 'name';

export function GoogleAuthButton() {
  const [step, setStep] = useState<Step>('button');
  const [pendingCredential, setPendingCredential] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credential: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/google', { credential });
      if (res.data.status === 'needs_name') {
        setPendingCredential(credential);
        setFullName(res.data.suggested_name ?? '');
        setStep('name');
      } else {
        login(res.data.access_token, res.data.user);
        toast.success('Hoş geldiniz!');
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Google ile giriş başarısız.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('/auth/google', {
        credential: pendingCredential,
        full_name: fullName.trim(),
      });
      login(res.data.access_token, res.data.user);
      toast.success('Hesabınız oluşturuldu!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Hesap oluşturulamadı.'
      );
      // If token expired or invalid, go back to Google button so user can re-authenticate
      if (err.response?.status === 400) {
        setStep('button');
        setPendingCredential('');
        setFullName('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'name') {
    return (
      <form onSubmit={handleNameSubmit} className="space-y-3">
        <p className="text-sm text-[#787774] dark:text-[#908d89]">
          Google hesabınızla devam etmek için adınızı girin.
        </p>
        <div className="space-y-1.5">
          <label htmlFor="google-fullname" className="text-xs font-semibold text-[#787774] dark:text-[#908d89] uppercase tracking-wider">
            Ad Soyad
          </label>
          <input
            id="google-fullname"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Adınız Soyadınız"
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
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Devam Et →'}
        </button>
        <button
          type="button"
          onClick={() => { setStep('button'); setPendingCredential(''); setFullName(''); }}
          className="w-full text-xs text-[#787774] dark:text-[#908d89] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors py-1"
        >
          ← Geri dön
        </button>
      </form>
    );
  }

  return (
    <div className={`flex justify-center${isLoading ? ' opacity-60 pointer-events-none' : ''}`}>
      <GoogleLogin
        onSuccess={(cr) => { if (cr.credential) handleGoogleSuccess(cr.credential); }}
        onError={() => toast.error('Google ile giriş başarısız.')}
        theme="outline"
        size="large"
        width="360"
        text="continue_with"
        shape="rectangular"
      />
    </div>
  );
}
