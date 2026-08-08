import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en';
import tr from './tr';
import es from './es';
import de from './de';
import fr from './fr';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tr: { translation: tr },
      es: { translation: es },
      de: { translation: de },
      fr: { translation: fr },
    },
    fallbackLng: 'en',
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

const SUPPORTED = ['tr', 'es', 'de', 'fr', 'en'] as const;

/**
 * Keep <html lang> in step with the UI language.
 *
 * It decides more than screen readers and SEO: CSS `text-transform: uppercase`
 * follows the document's language rules, and Turkish uppercases "i" as "İ". The
 * static HTML ships lang="tr" because its prerendered copy really is Turkish -
 * correct for crawlers - so an English UI that never corrected the attribute
 * rendered its own labels through Turkish casing: "LATEST ANALYSİS",
 * "HİGH PRİORİTY", "REWRİTE AVAİLABLE", "SKİLLS".
 */
function applyDocumentLanguage(lng: string | undefined): void {
  document.documentElement.lang =
    SUPPORTED.find((l) => (lng ?? '').startsWith(l)) ?? 'en';
}

i18n.on('languageChanged', applyDocumentLanguage);

// languageChanged fires on a CHANGE, and the language picked up at startup is
// not one - so on first load nothing ran and the attribute kept whatever the
// static HTML shipped. Switching language by hand fixed it until the next
// reload, which is why it looked intermittent.
applyDocumentLanguage(i18n.language);

export default i18n;
