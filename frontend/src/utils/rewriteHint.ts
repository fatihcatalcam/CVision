/**
 * Splits an AI `rewrite_hint` into the before and after halves.
 *
 * The model is asked for `Before: X -> After: Y` (see OUTPUT_RULES in
 * backend/app/services/ai_service.py) but does not always comply: the arrow
 * comes back as ->, →, or an em dash, "After:" is sometimes missing, and each
 * half usually arrives already wrapped in quotes.
 *
 * This lived inline in AnalysisPage and looked for a literal "â†’" - a "→"
 * that had been saved once through the wrong encoding, so it matched nothing.
 * The before half then swallowed the arrow and a stray quote and rendered as
 *   ""…evrak takip süreçlerine aktif destek verilmesi. " -> "
 * on every suggestion that carried a rewrite.
 */

/** -> and the various dashes and arrows models substitute for it. */
const ARROW = /\s*(?:-+>|–>|—>|→|⇒)\s*/;

/** Quotes the model wraps each half in; the panel adds its own. */
const OUTER_QUOTES = /^["'`“”‘’\s]+|["'`“”‘’\s]+$/g;

export interface RewriteHint {
  /** The quoted CV text. Empty when the hint carries only a replacement. */
  before: string;
  /** The suggested replacement. Falls back to the whole hint. */
  after: string;
}

function unquote(value: string): string {
  return value.replace(OUTER_QUOTES, '').trim();
}

export function parseRewriteHint(raw: string | null | undefined): RewriteHint {
  const hint = raw?.trim() ?? '';
  if (!hint) return { before: '', after: '' };

  // Labelled form: "Before: X -> After: Y", or either label on its own.
  const labelledBefore = hint.match(
    /before\s*[:\-]?\s*([\s\S]+?)(?=\s*(?:-+>|–>|—>|→|⇒)|\s*after\s*[:\-]|$)/i,
  );
  const labelledAfter = hint.match(/after\s*[:\-]?\s*([\s\S]+)/i);

  if (labelledBefore || labelledAfter) {
    return {
      before: unquote(labelledBefore?.[1] ?? ''),
      after: unquote(labelledAfter?.[1] ?? hint),
    };
  }

  // Unlabelled arrow form: "X -> Y".
  if (ARROW.test(hint)) {
    const [first, ...rest] = hint.split(ARROW);
    return { before: unquote(first), after: unquote(rest.join(' ')) };
  }

  // No structure at all - treat the whole thing as the replacement, which is
  // what the panel shows when there is nothing to compare against.
  return { before: '', after: unquote(hint) };
}
