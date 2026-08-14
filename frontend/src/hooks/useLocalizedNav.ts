import { useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { splitLangPath, localizedPath, isLocalizedPath } from '../i18n/routes';

/**
 * Links and navigation that stay inside the visitor's language tree.
 *
 * Every public page hard-coded its destinations - `href="/about"`,
 * `navigate('/try')` - which was correct while there was exactly one tree.
 * With /en it means the English About page's "back to home" link points at the
 * TURKISH homepage: the visitor is thrown into another language mid-session,
 * and a crawler following the English page's links leaves the English tree
 * immediately, which is the opposite of what the hreflang set just promised.
 *
 * Paths that are not translated - /login, /register, /dashboard and the rest of
 * the app behind auth - pass through untouched. They exist once, so prefixing
 * them would only invent 404s.
 */
export function useLocalizedNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useMemo(
    () => splitLangPath(location.pathname),
    [location.pathname],
  );

  /** The href for `path` in the current tree. */
  const href = useCallback(
    (path: string) => (isLocalizedPath(path) ? localizedPath(path, lang) : path),
    [lang],
  );

  /** navigate(), but staying in the current tree. */
  const go = useCallback((path: string) => navigate(href(path)), [navigate, href]);

  return { href, go, lang };
}
