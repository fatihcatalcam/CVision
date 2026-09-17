import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScanSearch } from 'lucide-react';

interface ImagePdfHelpProps {
  /** Take the user back to picking a file. */
  onUploadOther: () => void;
  /** Shown only to signed-in users, whose credits were refunded. */
  refunded?: boolean;
  /** Rendered under the main action: signup on /try, the dashboard in the app. */
  secondary?: ReactNode;
}

/**
 * What to say when a CV has no text layer - 22% of uploads in September 2026,
 * and two in three that month's final week among /try visitors who never
 * signed up.
 *
 * It replaces a single sentence and a "Try again" button. The sentence told
 * people to export from Word, which is no help to someone whose only CV is a
 * phone photo, and the button invited them to upload the same file again: 45
 * such failures came from 26 files. So this names the three ways people
 * actually end up here, gives each a concrete fix, and offers a check they can
 * run themselves before trying again. The button says "a different file"
 * because the same one will fail the same way.
 *
 * Colours come from the theme tokens: the screen is reached in dark mode as
 * often as in light, and a hardcoded dark button vanishes there.
 */
export function ImagePdfHelp({ onUploadOther, refunded = false, secondary }: ImagePdfHelpProps) {
  const { t } = useTranslation();

  const fixes = [t('imagePdf.fixWord'), t('imagePdf.fixCanva'), t('imagePdf.fixPhoto')];

  return (
    <div data-testid="image-pdf-help" className="w-full max-w-lg mx-auto text-left">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-[var(--color-warning-bg)] text-[var(--color-warning)]">
        <ScanSearch className="w-6 h-6" aria-hidden="true" />
      </div>

      <h2 className="text-xl font-bold tracking-tight mb-2 text-[var(--color-foreground)]">
        {t('imagePdf.title')}
      </h2>
      <p className="text-sm leading-relaxed mb-5 text-[var(--color-muted)]">
        {t('imagePdf.body')}
      </p>

      <p className="label-sm mb-2">{t('imagePdf.fixesTitle')}</p>
      <ol className="space-y-2.5 mb-4">
        {fixes.map((fix, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-[var(--color-foreground)]">
            <span
              aria-hidden="true"
              className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold bg-[var(--color-accent)] text-[var(--color-primary)]"
            >
              {i + 1}
            </span>
            <span>{fix}</span>
          </li>
        ))}
      </ol>

      <p className="text-xs leading-relaxed p-3 rounded-lg mb-6 bg-[var(--color-accent)] text-[var(--color-foreground)]">
        {t('imagePdf.check')}
      </p>

      {refunded && (
        <p className="text-xs mb-3 text-[var(--color-success)]">{t('imagePdf.refunded')}</p>
      )}

      <button
        type="button"
        onClick={onUploadOther}
        className="w-full h-11 rounded-xl text-sm font-bold bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-90 active:scale-[0.98] transition-all"
      >
        {t('imagePdf.uploadOther')}
      </button>

      {secondary}
    </div>
  );
}
