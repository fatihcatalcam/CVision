import { useTranslation } from 'react-i18next';
import { DEVELOPER_NAME, DEVELOPER_URL } from '../../constants/developer';

/**
 * "Developer: Çatalçam Yazılım" under the public footers. A plain followed
 * link on purpose - it is a real credit. The prerender writes the same line
 * into the static HTML (scripts/prerender.ts), so crawlers that do not run the
 * app see it too. Only the label is translated; the studio's name is the same
 * in every language.
 */
export function DeveloperCredit({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <p className={`text-xs text-[#6B6A65] dark:text-[#908d89] ${className}`}>
      {t('common.developer')}:{' '}
      <a
        href={DEVELOPER_URL}
        target="_blank"
        rel="noopener"
        className="font-medium text-[#111111] dark:text-[#e8e7e4] underline-offset-2 hover:underline"
      >
        {DEVELOPER_NAME}
      </a>
    </p>
  );
}
