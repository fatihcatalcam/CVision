import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import en from './en';
import tr from './tr';
import es from './es';
import de from './de';
import fr from './fr';

/**
 * A label rendered beside an arrow icon must not carry an arrow of its own.
 *
 * The guides shipped reading "← ← Ana sayfaya dön": lucide's <ArrowLeft /> plus
 * a literal "←" that had been baked into the i18n string back when the link was
 * text only. It was on About and both guides, in all five languages, and every
 * one of them looked fine in the file - you only see it rendered.
 *
 * So this does not list the keys. It reads the components, finds every t('...')
 * that sits next to an arrow icon, and checks those keys in every locale. A new
 * page that pairs an icon with an arrow-prefixed string fails here rather than
 * in the browser.
 *
 * Strings with no icon beside them - auth.backToHome, nameModal.back - keep
 * their arrows, and are not collected precisely because no icon was found.
 */

const SRC = path.resolve(__dirname, '..');
const LOCALES = { en, tr, es, de, fr };

/** Arrow glyphs people paste into copy. */
const ARROWS = /[←→⇐⇒⟵⟶]/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') walk(full, out);
    } else if (/\.tsx$/.test(entry.name) && !entry.name.includes('.test.')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Keys rendered within a short distance of an arrow icon.
 *
 * The window is deliberately small - an icon and its label sit in the same JSX
 * element - so a t() further down the file is not swept in.
 */
function keysNextToArrowIcons(): { key: string; file: string }[] {
  const found: { key: string; file: string }[] = [];
  const files = walk(SRC);

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const icon of text.matchAll(/<Arrow(Left|Right)\b[^>]*\/>/g)) {
      const window = text.slice(icon.index!, icon.index! + 220);

      // Literal keys: t('howAts.back')
      for (const call of window.matchAll(/\bt\(\s*['"`]([\w.]+)['"`]/g)) {
        found.push({ key: call[1], file: path.relative(SRC, file) });
      }

      // Keys built from a namespace prop: t(`${ns}.back`). ArticlePage does
      // this, and it is the component behind both guides - the exact pages the
      // duplicated arrow was reported on. The first version of this scan only
      // matched literals and so checked everything EXCEPT them.
      for (const call of window.matchAll(/\bt\(\s*`\$\{(\w+)\}\.([\w.]+)`/g)) {
        const [, prop, suffix] = call;
        for (const ns of namespacesPassedAs(prop, files)) {
          found.push({ key: `${ns}.${suffix}`, file: path.relative(SRC, file) });
        }
      }
    }
  }
  return found;
}

/** Every value passed as `prop="..."` anywhere in the tree, e.g. ns="howAts". */
function namespacesPassedAs(prop: string, files: string[]): string[] {
  const values = new Set<string>();
  const re = new RegExp(`\\b${prop}=["'\`]([\\w.]+)["'\`]`, 'g');
  for (const file of files) {
    for (const m of fs.readFileSync(file, 'utf8').matchAll(re)) values.add(m[1]);
  }
  return [...values];
}

function resolve(bundle: unknown, key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], bundle);
  return typeof value === 'string' ? value : undefined;
}

describe('labels beside arrow icons', () => {
  it('finds the labels to check', () => {
    // If the scan silently matched nothing, the test below would pass forever
    // while proving nothing.
    expect(keysNextToArrowIcons().length).toBeGreaterThan(3);
  });

  it('carry no arrow of their own, in any language', () => {
    const offenders: string[] = [];

    for (const { key, file } of keysNextToArrowIcons()) {
      for (const [lang, bundle] of Object.entries(LOCALES)) {
        const value = resolve(bundle, key);
        // Interpolated or dynamic keys resolve to nothing; not this test's job.
        if (!value) continue;
        if (ARROWS.test(value)) {
          offenders.push(`${lang}.${key} = ${JSON.stringify(value)}  (${file})`);
        }
      }
    }

    expect(
      offenders,
      `these render an arrow twice - once as the icon, once as text:\n  ` +
        `${offenders.join('\n  ')}\nDrop the character from the string; the icon is the arrow.`,
    ).toEqual([]);
  });
});
