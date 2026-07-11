import api from './api';

const ANON_TOKEN_KEY = 'cvision_anon_token';

export function saveAnonToken(token: string): void {
  localStorage.setItem(ANON_TOKEN_KEY, token);
}

export function getAnonToken(): string | null {
  return localStorage.getItem(ANON_TOKEN_KEY);
}

export function clearAnonToken(): void {
  localStorage.removeItem(ANON_TOKEN_KEY);
}

/**
 * If an anonymous analysis token is pending, claim it for the now-authenticated
 * user. Returns the claimed CV hashid (to navigate to /analysis/:id) or null.
 * MUST be called AFTER login() has stored the JWT (the api client injects it).
 */
export async function claimPendingAnalysis(): Promise<string | null> {
  const token = getAnonToken();
  if (!token) return null;
  try {
    const res = await api.post('/public/claim', { token });
    clearAnonToken();
    return res.data.cv_id as string;
  } catch {
    // Already claimed / invalid / expired — drop the token silently.
    clearAnonToken();
    return null;
  }
}
