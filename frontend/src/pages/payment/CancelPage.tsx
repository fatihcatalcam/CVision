import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export function CancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md animate-in slide-up">
        {/* Cancel Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>

        <h1 className="text-3xl font-bold text-[#111111] dark:text-[#e8e7e4] mb-3">Ödeme İptal Edildi</h1>
        <p className="text-[#787774] dark:text-[#908d89] mb-8 leading-relaxed">
          Ödeme işlemi tamamlanamadı veya iptal edildi. Hesabınızda herhangi bir ücret alınmadı.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/pricing')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] font-semibold hover:bg-[#2a2a2a] dark:hover:bg-[#d0cfcc] active:scale-[0.98] transition-all text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Tekrar Dene
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#F7F6F3] dark:bg-[#1c1c1a] border border-[#EAEAEA] dark:border-white/[0.07] text-[#111111] dark:text-[#e8e7e4] font-semibold hover:bg-[#EAEAEA] dark:hover:bg-white/[0.07] transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard'a Dön
          </button>
        </div>
      </div>
    </div>
  );
}
