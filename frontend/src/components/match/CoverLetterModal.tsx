import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface CoverLetterModalProps {
  content: string;
  onClose: () => void;
}

export function CoverLetterModal({ content, onClose }: CoverLetterModalProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className="w-full max-w-xl rounded-[var(--radius-lg)] shadow-xl flex flex-col max-h-[80vh]"
        style={{ background: 'var(--color-card)', border: '1px solid var(--color-card-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0" style={{ borderColor: 'var(--color-card-border)' }}>
          <h2 className="font-semibold text-base" style={{ color: 'var(--color-foreground)' }}>
            {t('match.coverLetterTitle')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#F1F1EF] dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-foreground)' }}>
            {content}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t flex-shrink-0" style={{ borderColor: 'var(--color-card-border)' }}>
          <Button variant="ghost" size="sm" onClick={onClose}>{t('common.close')}</Button>
          <Button size="sm" onClick={handleCopy}>
            {copied
              ? <><Check className="w-4 h-4" />{t('match.copied')}</>
              : <><Copy className="w-4 h-4" />{t('match.copyButton')}</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
