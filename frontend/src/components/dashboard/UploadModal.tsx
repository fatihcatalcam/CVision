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
      <div className="w-full max-w-2xl surface shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] dark:border-white/[0.07]">
          <h2 className="text-base font-bold text-[#111111] dark:text-[#e8e7e4]">Yeni CV Analizi</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A09D9A] hover:text-[#111111] dark:hover:text-[#e8e7e4] hover:bg-[#F5F5F5] dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* CVUploader fills the card with its own internal padding */}
        <div className="p-6">
          <CVUploader
            embedded
            onUploadSuccess={(cvId) => {
              onClose();
              onUploadSuccess(cvId);
            }}
          />
        </div>
      </div>
    </div>
  );
}
