/**
 * Where to send someone after they sign in.
 *
 * ProtectedRoute hands the page a logged-out visitor asked for to /login in
 * router state. Without it, a link such as the "Ön yazı oluştur" button on
 * /on-yazi-ornekleri (which goes to /match) dropped people on the dashboard
 * after signing in, with no trace of what they came for.
 *
 * Only a path inside this app is accepted. "//evil.example" is a URL to
 * another host as far as the browser is concerned, so it is refused too.
 */
export function returnPath(state: unknown, fallback = '/dashboard'): string {
  const from = (state as { from?: unknown } | null)?.from;
  if (typeof from !== 'string') return fallback;
  if (!from.startsWith('/') || from.startsWith('//') || from.startsWith('/\\')) return fallback;
  return from;
}
