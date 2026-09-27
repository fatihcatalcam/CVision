import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The monthly subscription is gone. Nothing may still describe it.
 *
 * This has now been "fixed" three times, and each time the fix was scoped to
 * the files someone happened to grep. First llms.txt and two JSON-LD blocks.
 * Then home.faq.a3 in five locales - the copy visitors read on the homepage.
 * Then the founder found it again on the About page, and the sweep that
 * followed also turned it up in the Terms of Service, where a legal document
 * was setting out the cancellation and refund terms of a product that does not
 * exist, and in a dead hook still holding the price as a constant.
 *
 * Grepping by hand keeps missing places because the phrasing differs per file
 * and per language. So the check is a test over the whole tree, and it fails on
 * the price, on the trial, and on the weekly-quota wording in all five
 * languages at once.
 *
 * A fourth time, and this one was live for six days: removing the Normal/Pro
 * tiers from the uploader left every page that quoted them still quoting them -
 * /pricing, the FAQ, About, the llms.txt fed to AI crawlers and, worst, the
 * JSON-LD offer block that tells Google what the product costs. The patterns
 * below now also cover the two tiers and the "Pro plan" they were named after,
 * because the tier names outlived the subscription that introduced them.
 *
 * If a real subscription ever comes back, delete this file - do not weaken it.
 */

const ROOT = path.resolve(__dirname, '../..');

const SEARCHED = ['src', 'public', 'index.html'];

/** Phrases that only make sense if the retired subscription still existed. */
const RETIRED: { pattern: RegExp; why: string }[] = [
  { pattern: /199[.,]99/, why: 'the retired ₺199.99/month subscription price' },
  { pattern: /7[- ](day|günlük|tägig)/i, why: 'the retired 7-day free trial' },
  { pattern: /7 (days|días|jours)/i, why: 'the retired 7-day free trial' },
  { pattern: /\b(3|50) (CV )?(analyses|análisis|analyses de CV) per week/i, why: 'the retired weekly quota' },
  { pattern: /haftada (3|50) (CV )?analiz/i, why: 'the retired weekly quota' },
  { pattern: /(3|50) (Lebenslauf-)?Analysen pro Woche/i, why: 'the retired weekly quota' },
  { pattern: /(3|50) análisis (de CV )?por semana/i, why: 'the retired weekly quota' },
  { pattern: /(3|50) analyses (de CV )?par semaine/i, why: 'the retired weekly quota' },
  // The plan the tiers were named after. "Pro" on its own is too common to
  // ban, so each language's word for the plan is spelled out.
  { pattern: /\bPro[- ](plan|Plan|Tarif)\b/, why: 'the retired Pro plan' },
  { pattern: /\b(plan|forfait|plano) Pro\b/i, why: 'the retired Pro plan' },
  { pattern: /\bPro plan[ıi]\b/i, why: 'the retired Pro plan' },
  // The Normal/Pro split itself: one analysis now, and it includes the report.
  { pattern: /\b(Normal|Pro) (CV )?analysis\b/i, why: 'the removed Normal/Pro tiers' },
  { pattern: /\b(Normal|Pro) (CV )?analiz/i, why: 'the removed Normal/Pro tiers' },
  // Accent-tolerant: the locales are accented, but a hand-typed line may not be.
  { pattern: /\ban[áa]lisis (Normal|Pro)\b/i, why: 'the removed Normal/Pro tiers' },
  { pattern: /\b(normale Analyse|Pro-Analyse)/i, why: 'the removed Normal/Pro tiers' },
  { pattern: /\banalyse (Normale|Pro)\b/i, why: 'the removed Normal/Pro tiers' },
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') walk(full, out);
    } else if (/\.(tsx?|txt|html|md)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function filesToCheck(): string[] {
  return SEARCHED.flatMap((entry) => {
    const full = path.join(ROOT, entry);
    if (!fs.existsSync(full)) return [];
    return fs.statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe('the retired subscription', () => {
  for (const { pattern, why } of RETIRED) {
    it(`is not described anywhere: ${why}`, () => {
      const hits: string[] = [];

      for (const file of filesToCheck()) {
        // This file quotes the phrases on purpose.
        if (file === __filename) continue;
        // A comment explaining that the subscription was REMOVED is worth
        // keeping - SettingsPage carries one - so comments are skipped, and
        // that means tracking block comments across lines rather than testing
        // each line's first characters. The continuation lines of a /* */ or
        // {/* */} block start with prose, not with a marker.
        const text = fs.readFileSync(file, 'utf8');
        let inBlock = false;

        text.split('\n').forEach((line, i) => {
          const opened = /\/\*|<!--/.test(line);
          const closed = /\*\/|-->/.test(line);
          const wasInBlock = inBlock;
          if (opened && !closed) inBlock = true;
          else if (closed) inBlock = false;

          const isComment =
            wasInBlock || inBlock || opened || /^\s*(\/\/|\*|#)/.test(line);

          if (!isComment && pattern.test(line)) {
            hits.push(`${path.relative(ROOT, file)}:${i + 1}`);
          }
        });
      }

      expect(
        hits,
        `${why} is still live copy at: ${hits.join(', ')}. ` +
          `CVision is credit-based - no subscription, no trial, no weekly quota. ` +
          `Prices live in Lemon Squeezy and belong on /pricing, not in a file.`,
      ).toEqual([]);
    });
  }
});
