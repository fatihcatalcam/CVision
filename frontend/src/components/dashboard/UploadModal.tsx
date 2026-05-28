import { X } from 'lucide-react';
import { CVUploader } from '../cv/CVUploader';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (cvId: string) => void;
}

export function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#141413] rounded-2xl shadow-2xl border border-[#EAEAEA] dark:border-white/[0.07] p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#111111] dark:text-[#e8e7e4]">Yeni CV Analizi</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A09D9A] hover:text-[#111111] dark:hover:text-[#e8e7e4] hover:bg-[#F5F5F5] dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <CVUploader
          onUploadSuccess={(cvId) => {
            onClose();
            onUploadSuccess(cvId);
          }}
        />
      </div>
    </div>
  );
}
