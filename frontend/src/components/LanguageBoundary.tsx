import { useLayoutEffect } from 'react';
import { Outlet } from 'react-router-dom';
import i18n from '../i18n';
import type { UrlLanguage } from '../i18n/routes';

/**
 * Pins the UI language for a language-prefixed route tree.
 *
 * The URL has to win over localStorage and the browser's Accept-Language here.
 * Detection is right for the bare Turkish paths, where there is no language in
 * the URL to contradict, but under /en it is not a preference any more: the
 * page is prerendered in English, its canonical says /en, and its hreflang
 * tells Google this URL IS the English one. A visitor whose stored language
 * was Turkish would have been served the Turkish UI at an English URL, which
 * is precisely the mismatch hreflang exists to prevent.
 *
 * i18n/index.ts reads the same prefix at startup, so a direct hit on /en/try
 * renders English on the first paint. This covers the other case - navigating
 * into the tree from inside the SPA, where no detector runs again.
 *
 * It deliberately imports the i18n singleton rather than calling
 * useTranslation(). The hook re-renders this component on every language
 * change and hands back a fresh `i18n` reference each time, so with `i18n` in
 * the dependency array the effect re-ran on language changes as well as route
 * changes - and fought the user. Picking Turkish from the switcher on
 * /en/about went: changeLanguage('tr') -> this effect wakes up, sees "want en,
 * have tr" -> changeLanguage('en'), all before the navigation to /about landed.
 * The switcher appeared to do nothing at all.
 *
 * The route is the only thing this component reacts to, so `lang` is the only
 * dependency it gets.
 *
 * useLayoutEffect rather than useEffect: it runs before the browser paints, so
 * entering the tree does not flash a frame of the previous language.
 */
export function LanguageBoundary({ lang }: { lang: UrlLanguage }) {
  useLayoutEffect(() => {
    if (!i18n.language?.startsWith(lang)) i18n.changeLanguage(lang);
  }, [lang]);

  return <Outlet />;
}
