import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('tr') ? 'tr' : 'en';

  return (
    <button
      onClick={() => i18n.changeLanguage(current === 'tr' ? 'en' : 'tr')}
      className="flex items-center justify-center w-8 h-8 rounded-lg
        text-[#787774] dark:text-[#908d89]
        hover:text-[#111111] dark:hover:text-[#e8e7e4]
        hover:bg-[#F7F6F3] dark:hover:bg-white/[0.06]
        border border-transparent hover:border-[#EAEAEA] dark:hover:border-white/[0.07]
        transition-all active:scale-[0.95]
        text-xs font-bold"
      aria-label={current === 'tr' ? 'Switch to English' : 'Türkçeye geç'}
    >
      {current === 'tr' ? 'EN' : 'TR'}
    </button>
  );
}
