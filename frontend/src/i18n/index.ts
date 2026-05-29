import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en';
import tr from './tr';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tr: { translation: tr },
    },
    fallbackLng: 'tr',
    defaultNS: 'translation',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'cvision_lang',
    },
    interpolation: {
      escapeValue: false,
    },
  });

// Keep <html lang="..."> in sync with selected language
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng.startsWith('tr') ? 'tr' : 'en';
});

export default i18n;
