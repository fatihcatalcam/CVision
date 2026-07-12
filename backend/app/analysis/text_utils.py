"""
Text normalization utilities for language-fair CV analysis.

PDF extraction and the five supported UI languages (en/tr/es/de/fr) produce
text with diacritics that regex patterns written in ASCII can't match — and
PDF extractors frequently *strip or mangle* those diacritics, so the same CV
can arrive as "EĞİTİM" or "EGITIM". All matching therefore runs against a
normalized form: lowercase, diacritics folded to ASCII base letters.
"""

import unicodedata

# Characters that don't decompose to base+combining under NFD and need an
# explicit fold. Turkish dotless ı is the critical one.
_SPECIAL_FOLDS = str.maketrans({
    "ı": "i",   # Turkish dotless i (U+0131) — not NFD-decomposable
    "ß": "ss",  # German sharp s
    "æ": "ae",
    "œ": "oe",
    "ø": "o",
    "đ": "d",
    "ł": "l",
})


def normalize_text(text: str) -> str:
    """
    Lowercase + fold diacritics to ASCII base letters, preserving newlines.

    Handles the Turkish casing trap: "İ".lower() yields "i" + combining dot
    (U+0307) in Python, which NFD decomposition then strips along with all
    other combining marks (ö→o, ü→u, ç→c, ş→s, ğ→g, é→e, ...).
    """
    if not text:
        return ""
    lowered = text.lower()
    decomposed = unicodedata.normalize("NFD", lowered)
    stripped = "".join(
        ch for ch in decomposed if unicodedata.category(ch) != "Mn"
    )
    return stripped.translate(_SPECIAL_FOLDS)
