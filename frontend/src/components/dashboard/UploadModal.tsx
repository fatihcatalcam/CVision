import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CVUploader } from '../cv/CVUploader';
import { ModalShell } from '../ui/ModalShell';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (cvId: string) => void;
}

export function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const { t } = useTranslation();

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      label={t('dashboard.uploadModal.title')}
      containerClassName="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
      panelClassName="w-full max-w-2xl surface shadow-2xl rounded-2xl my-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] dark:border-white/[0.07]">
        <h2 className="text-base font-bold text-[#111111] dark:text-[#e8e7e4]">{t('dashboard.uploadModal.title')}</h2>
        <button
          onClick={onClose}
          aria-label={t('common.close')}
          className="p-1.5 rounded-lg text-[#A09D9A] hover:text-[#111111] dark:hover:text-[#e8e7e4] hover:bg-[#F5F5F5] dark:hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Content */}
      <div className="p-6">
        <CVUploader
          embedded
          onUploadSuccess={(cvId) => {
            onClose();
            onUploadSuccess(cvId);
          }}
        />
      </div>
    </ModalShell>
  );
}
