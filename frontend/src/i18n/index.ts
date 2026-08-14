import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en';
import tr from './tr';
import es from './es';
import de from './de';
import fr from './fr';
import { splitLangPath, DEFAULT_URL_LANGUAGE } from './routes';

/**
 * The URL prefix outranks every stored preference.
 *
 * /en/try is not "a visitor who likes English" - it is the English URL of that
 * page, prerendered in English, canonicalised to itself and named in the
 * hreflang set. Serving a Turkish UI there because localStorage said so is the
 * exact mismatch hreflang is meant to rule out.
 *
 * It returns undefined for the bare Turkish paths rather than 'tr', so those
 * keep falling through to the stored preference and the browser's languages -
 * the behaviour that was already there, and the only way /about can still show
 * a German visitor German.
 */
const detector = new LanguageDetector();
detector.addDetector({
  name: 'urlPrefix',
  lookup() {
    if (typeof window === 'undefined') return undefined;
    const { lang } = splitLangPath(window.location.pathname);
    return lang === DEFAULT_URL_LANGUAGE ? undefined : lang;
  },
});

i18n
  .use(detector)
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
      order: ['urlPrefix', 'localStorage', 'navigator'],
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
