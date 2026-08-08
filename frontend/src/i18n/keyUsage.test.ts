import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import en from './en';

/**
 * Every t('...') in the app must resolve to a real key.
 *
 * A missing key does not throw - react-i18next renders the key itself, so the
 * screen shows "DASHBOARD.PROBADGE" or "TRY.FREEBADGE" and nothing fails. Both
 * of those shipped: a sweep that deleted the subscription copy used a regex on
 * the key name with no count limit, so it removed `proBadge` and `freeBadge`
 * from every block that had one, not just the settings block it was aiming at.
 * `try.freeBadge` was the green "100% FREE" pill in the anonymous paywall - the
 * signup funnel - and it read as a raw key for a day.
 */

const SRC = path.resolve(__dirname, '..');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') walk(full, out);
    } else if (/\.tsx?$/.test(entry.name) && !entry.name.includes('.test.')) {
      out.push(full);
    }
  }
  return out;
}

function definedKeys(obj: unknown, prefix = '', acc = new Set<string>()): Set<string> {
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object') definedKeys(v, key, acc);
    else acc.add(key);
  }
  return acc;
}

/** i18next resolves `foo` from `foo_one` / `foo_other` when given a count. */
function resolves(key: string, keys: Set<string>): boolean {
  return keys.has(key) || keys.has(`${key}_other`) || keys.has(`${key}_one`);
}

describe('i18n key usage', () => {
  it('every key the code asks for exists in en', () => {
    const keys = definedKeys(en);
    const call = /\bt\(\s*['"]([A-Za-z0-9_.]+)['"]/g;
    const missing: string[] = [];

    for (const file of walk(SRC)) {
      if (file.includes(`${path.sep}i18n${path.sep}`)) continue;
      const text = fs.readFileSync(file, 'utf8');
      for (const [, key] of text.matchAll(call)) {
        if (!resolves(key, keys)) {
          missing.push(`${key}  (${path.relative(SRC, file)})`);
        }
      }
    }

    expect(missing, `keys used in code but missing from en.ts:\n${missing.join('\n')}`)
      .toEqual([]);
  });
});
