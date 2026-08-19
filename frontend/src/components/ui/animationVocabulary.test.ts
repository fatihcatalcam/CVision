import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Class names that generate no CSS are invisible failures.
 *
 * `tailwindcss-animate` is not a dependency of this project, but 18 of its
 * class names were in use across 14 files - `fade-in`, `zoom-in-95`,
 * `slide-up`, `scale-in`. None of them compiled to anything. Every one of
 * those elements silently fell back to the single custom `.animate-in`
 * keyframe in index.css, so a modal asking for "zoom in to 95% over 200ms"
 * actually got a generic 500ms slide-up, identical to the 404 page.
 *
 * Nothing failed, nothing warned, and the markup read as though the motion
 * had been designed per surface. This test is the warning that was missing.
 *
 * If the plugin is ever added on purpose, delete this file rather than
 * working around it.
 */

const SRC = path.resolve(__dirname, '../..');
const PKG = path.resolve(__dirname, '../../../package.json');

/** Utilities that only exist when tailwindcss-animate is installed. */
const PLUGIN_ONLY = [
  'fade-in',
  'fade-out',
  'zoom-in',
  'zoom-out',
  'slide-up',
  'slide-down',
  'scale-in',
  'scale-out',
  'slide-in-from',
  'slide-out-to',
  'animate-out',
];

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

describe('animation vocabulary', () => {
  it('does not depend on tailwindcss-animate', () => {
    // The premise of the test below. If someone installs the plugin, this
    // fails first and points at the right decision to make.
    const pkg = JSON.parse(fs.readFileSync(PKG, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    expect(Object.keys(deps)).not.toContain('tailwindcss-animate');
    expect(Object.keys(deps)).not.toContain('tw-animate-css');
  });

  it('never uses a class the build cannot generate', () => {
    const offenders: string[] = [];

    for (const file of walk(SRC)) {
      const text = fs.readFileSync(file, 'utf8');
      text.split('\n').forEach((line, i) => {
        for (const cls of PLUGIN_ONLY) {
          // Space-delimited inside a class string, so `.animate-in` and a
          // variable named fadeIn are both left alone.
          if (new RegExp(`[\\s"'\`]${cls}[\\s"'\`-]`).test(line)) {
            offenders.push(`${path.relative(SRC, file)}:${i + 1}  ${cls}`);
          }
        }
      });
    }

    expect(offenders).toEqual([]);
  });

  it('keeps the motion classes it does define', () => {
    // The counterpart: these are real, defined in index.css, and the cleanup
    // above must not have taken them out along with the dead names.
    const css = fs.readFileSync(path.join(SRC, 'index.css'), 'utf8');

    for (const cls of ['.animate-in', '.modal-panel', '.modal-scrim', '.collapse-region', '.reveal']) {
      expect(css).toContain(cls);
    }
  });
});
