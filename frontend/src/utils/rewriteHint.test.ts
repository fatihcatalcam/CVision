import { describe, it, expect } from 'vitest';
import { parseRewriteHint } from './rewriteHint';

/**
 * The before/after split on an AI rewrite suggestion.
 *
 * The version this replaces looked for a literal "â†’" - a "→" saved once
 * through the wrong encoding - so the arrow never matched. The before half then
 * ran to the "After:" label and swallowed the arrow and a quote, and the panel
 * added quotes of its own on top. Every rewrite rendered as:
 *
 *   ""…evrak takip süreçlerine aktif destek verilmesi. " -> "
 *
 * The first test is that exact string.
 */

describe('parseRewriteHint', () => {
  it('splits the format the prompt actually asks for', () => {
    const hint =
      `Before: "Kamu kurumunun günlük ofis işleyişine ve evrak takip süreçlerine ` +
      `aktif destek verilmesi." -> After: "Evrak takip süreçlerini düzenleyerek ` +
      `[X] dosyanın zamanında işlenmesini sağladım."`;

    const { before, after } = parseRewriteHint(hint);

    expect(before).toBe(
      'Kamu kurumunun günlük ofis işleyişine ve evrak takip süreçlerine aktif destek verilmesi.',
    );
    expect(after).toBe(
      'Evrak takip süreçlerini düzenleyerek [X] dosyanın zamanında işlenmesini sağladım.',
    );
  });

  it('leaves no arrow stranded on the end of the before text', () => {
    // The visible symptom: the arrow rendered inside the red "before" box.
    const { before } = parseRewriteHint(`Before: 'Old text' -> After: 'New text'`);

    expect(before).not.toMatch(/->|→/);
    expect(before).toBe('Old text');
  });

  it("strips the model's own quotes so the panel does not double them", () => {
    const { before, after } = parseRewriteHint(`Before: "Old" -> After: "New"`);

    expect(before).toBe('Old');
    expect(after).toBe('New');
    expect(after.startsWith('"')).toBe(false);
  });

  it('accepts the unicode arrow the model sometimes returns instead', () => {
    const { before, after } = parseRewriteHint(`Before: 'Old text' → After: 'New text'`);

    expect(before).toBe('Old text');
    expect(after).toBe('New text');
  });

  it('handles an arrow with no labels at all', () => {
    const { before, after } = parseRewriteHint(`'Managed files' -> 'Owned [N] case files'`);

    expect(before).toBe('Managed files');
    expect(after).toBe('Owned [N] case files');
  });

  it('keeps a multi-line replacement intact', () => {
    const { after } = parseRewriteHint('Before: "A" -> After: "Line one\nLine two"');

    expect(after).toBe('Line one\nLine two');
  });

  it('treats an unstructured hint as the replacement, with nothing to compare', () => {
    const { before, after } = parseRewriteHint('Move the Skills section above Experience.');

    expect(before).toBe('');
    expect(after).toBe('Move the Skills section above Experience.');
  });

  it('returns empty halves for a structural suggestion carrying no hint', () => {
    expect(parseRewriteHint('')).toEqual({ before: '', after: '' });
    expect(parseRewriteHint(null)).toEqual({ before: '', after: '' });
  });
});
