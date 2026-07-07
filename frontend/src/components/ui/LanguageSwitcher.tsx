import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'tr', flag: '🇹🇷', label: 'Türkçe' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find(l => i18n.language?.startsWith(l.code)) ?? LANGUAGES[1];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-center gap-1 px-2 h-8 rounded-lg
          text-[#787774] dark:text-[#908d89]
          hover:text-[#111111] dark:hover:text-[#e8e7e4]
          hover:bg-[#F7F6F3] dark:hover:bg-white/[0.06]
          border border-transparent hover:border-[#EAEAEA] dark:hover:border-white/[0.07]
          transition-all active:scale-[0.95] text-base"
        aria-label="Select language"
      >
        <span>{current.flag}</span>
        <svg
          className={`w-3 h-3 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-36 rounded-xl border border-[#EAEAEA] dark:border-white/[0.07] bg-white dark:bg-[#1c1c1a] shadow-lg py-1 z-50">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left
                ${current.code === lang.code
                  ? 'text-[#111111] dark:text-[#e8e7e4] font-medium bg-[#F7F6F3] dark:bg-white/[0.05]'
                  : 'text-[#787774] dark:text-[#908d89] hover:text-[#111111] dark:hover:text-[#e8e7e4] hover:bg-[#F7F6F3] dark:hover:bg-white/[0.05]'
                }`}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
