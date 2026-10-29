import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * CVision reads PDFs only.
 *
 * The backend dropped TXT uploads (backend/app/parsing/parser_factory.py) and
 * the uploader accepts .pdf alone, but the homepage FAQ - which also ships as
 * FAQPage structured data - the About page and llms.txt kept saying "PDF or
 * TXT" in all five languages. That is the sentence AI assistants lift and
 * repeat, so a wrong one there is a wrong answer about the product.
 *
 * Advice about what to send an employer ("save as PDF unless the ad asks for
 * a TXT file") is fine; only the claim that CVision takes TXT is not.
 */

const ROOT = path.resolve(__dirname, '../..');
const FILES = ['src/i18n/tr.ts', 'src/i18n/en.ts', 'src/i18n/de.ts', 'src/i18n/es.ts', 'src/i18n/fr.ts', 'public/llms.txt', 'index.html'];

// "PDF or TXT", "PDF veya TXT", "PDF- oder TXT-Datei", "PDF y TXT", "PDF et TXT"...
const CLAIM = /PDF-? (or|and|veya|ve|oder|und|o|y|ou|et) TXT/i;

describe('upload formats in public copy', () => {
  it.each(FILES)('%s does not claim TXT uploads', (file) => {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    expect(text).not.toMatch(CLAIM);
  });
});
