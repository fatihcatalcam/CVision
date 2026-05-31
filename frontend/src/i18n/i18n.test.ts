import { describe, it, expect } from 'vitest';
import en from './en';
import tr from './tr';

/**
 * Locale parity smoke test.
 *
 * A missing key in one locale is exactly the bug class behind the late-night
 * "Günaydın" issue: the dashboard greeting added a `night` variant that must
 * exist in BOTH locales or react-i18next silently falls back. This test walks
 * the full key tree and fails if the two locales drift apart.
 */
function collectKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    collectKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe('i18n locale parity', () => {
  it('en and tr expose the identical set of keys', () => {
    const enKeys = collectKeys(en).sort();
    const trKeys = collectKeys(tr).sort();

    const missingInTr = enKeys.filter((k) => !trKeys.includes(k));
    const missingInEn = trKeys.filter((k) => !enKeys.includes(k));

    expect(missingInTr, `keys present in en but missing in tr: ${missingInTr.join(', ')}`).toEqual([]);
    expect(missingInEn, `keys present in tr but missing in en: ${missingInEn.join(', ')}`).toEqual([]);
  });

  it('both locales define every dashboard greeting variant', () => {
    for (const locale of [en, tr]) {
      expect(locale.dashboard.greeting.morning).toBeTruthy();
      expect(locale.dashboard.greeting.afternoon).toBeTruthy();
      expect(locale.dashboard.greeting.evening).toBeTruthy();
      expect(locale.dashboard.greeting.night).toBeTruthy();
    }
  });
});
