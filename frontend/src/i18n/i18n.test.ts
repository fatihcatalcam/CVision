import { describe, it, expect } from 'vitest';
import en from './en';
import tr from './tr';
import es from './es';
import de from './de';
import fr from './fr';

/**
 * Locale parity smoke test.
 *
 * A missing key in one locale is exactly the bug class behind the late-night
 * "Günaydın" issue: the dashboard greeting added a `night` variant that must
 * exist in BOTH locales or react-i18next silently falls back. This test walks
 * the full key tree and fails if the locales drift apart.
 *
 * It covers all five, not just en/tr: retiring the subscription copy left a
 * stale key behind in fr alone, because that one string happened to be written
 * with double quotes and slipped past the edit. Nothing failed.
 */
function collectKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    collectKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

const LOCALES = { tr, es, de, fr };

describe('i18n locale parity', () => {
  const enKeys = collectKeys(en).sort();

  for (const [name, locale] of Object.entries(LOCALES)) {
    it(`${name} exposes the identical set of keys as en`, () => {
      const keys = collectKeys(locale).sort();

      const missing = enKeys.filter((k) => !keys.includes(k));
      const extra = keys.filter((k) => !enKeys.includes(k));

      expect(missing, `keys present in en but missing in ${name}: ${missing.join(', ')}`).toEqual([]);
      expect(extra, `keys present in ${name} but missing in en: ${extra.join(', ')}`).toEqual([]);
    });
  }

  it('every locale defines every dashboard greeting variant', () => {
    for (const locale of [en, ...Object.values(LOCALES)]) {
      expect(locale.dashboard.greeting.morning).toBeTruthy();
      expect(locale.dashboard.greeting.afternoon).toBeTruthy();
      expect(locale.dashboard.greeting.evening).toBeTruthy();
      expect(locale.dashboard.greeting.night).toBeTruthy();
    }
  });
});
