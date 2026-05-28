import { Sparkles } from 'lucide-react';
import { CVUploader } from '../cv/CVUploader';

interface EmptyStateProps {
  onUploadSuccess: (cvId: string) => void;
}

export function EmptyState({ onUploadSuccess }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="w-full max-w-xl">
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 mb-6">
          <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-400">
              İlk analizin tamamen AI destekli ve ücretsiz
            </p>
            <p className="text-xs text-[#787774] dark:text-[#908d89] mt-0.5">
              CV'ni yükle: yönetici özeti, güçlü/zayıf yönler ve kişiselleştirilmiş öneriler al.
            </p>
          </div>
        </div>
        <CVUploader onUploadSuccess={onUploadSuccess} />
      </div>
    </div>
  );
}
