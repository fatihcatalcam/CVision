import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { ModalShell } from '../ui/ModalShell';

interface CoverLetterModalProps {
  /** null closes the modal; the text is retained through the exit. */
  content: string | null;
  onClose: () => void;
}

export function CoverLetterModal({ content, onClose }: CoverLetterModalProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  // The caller clears the content to close, which would blank the panel out
  // while it is still on screen animating away. Keep showing the last letter
  // we were given until it is actually gone.
  const lastContent = useRef('');
  if (content) lastContent.current = content;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(lastContent.current);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ModalShell
      isOpen={content !== null}
      onClose={onClose}
      label={t('match.coverLetterTitle')}
      scrimClassName="bg-black/50"
      panelClassName="w-full max-w-xl rounded-[var(--radius-lg)] shadow-xl flex flex-col max-h-[80vh] bg-[var(--color-card)] border border-[var(--color-card-border)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b flex-shrink-0" style={{ borderColor: 'var(--color-card-border)' }}>
        <h2 className="font-semibold text-base" style={{ color: 'var(--color-foreground)' }}>
          {t('match.coverLetterTitle')}
        </h2>
        <button
          onClick={onClose}
          aria-label={t('common.close')}
          className="p-1 rounded hover:bg-[#F1F1EF] dark:hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-foreground)' }}>
          {lastContent.current}
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
    </ModalShell>
  );
}
