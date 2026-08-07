"""
Section Detector - identifies standard CV sections using keyword/synonym matching.
Detects: education, experience, skills, projects, certifications, summary/objective, languages, references.
Contributes to the completeness score.
"""

import logging
import re

from app.analysis.base_analyzer import BaseAnalyzer, AnalysisContext

logger = logging.getLogger("cvision.analysis.section_detector")

# Section definitions: section_name -> list of keyword patterns.
# Matched against context.text_normalized (lowercase, diacritics folded to
# ASCII — see text_utils.normalize_text), so patterns are written in ASCII.
# Covers all five UI languages: en / tr / es / de / fr.
# Turkish is agglutinative — suffix-tolerant stems (\w*) are used so
# "deneyim", "deneyimi", "deneyimlerim" all match. German section titles are
# often compounds ("Berufserfahrung"), so those stems are left-unanchored.
SECTION_PATTERNS: dict[str, list[str]] = {
    "education": [
        # en
        r"\beducation\b", r"\bacademic\b", r"\buniversity\b", r"\bcollege\b",
        r"\bdegree\b", r"\bbachelor\b", r"\bmaster\b", r"\bphd\b", r"\bdiploma\b",
        r"\bgpa\b", r"\bschool\b", r"\bgraduat",
        # tr (normalized, suffix-tolerant)
        r"\begitim\w*", r"\blise\w*", r"\buniversite\w*", r"\bokul\w*",
        r"\bmezun\w*", r"\bakademi\w*", r"\blisans\w*",
        # es
        r"\beducacion\b", r"\bformacion\b", r"\buniversidad\w*",
        r"\blicenciatura\w*", r"\btitulo\b", r"\bgrado\b",
        # de
        r"\bausbildung\w*", r"\bstudium\b", r"\bhochschule\w*",
        r"\buniversitat\w*", r"\babschluss\w*", r"\babitur\b",
        # fr
        r"\bformation\w*", r"\bdiplome\w*", r"\blicence\b", r"\becole\b",
    ],
    "experience": [
        # en
        r"\bexperience\b", r"\bwork\s*experience\b", r"\bemployment\b",
        r"\bprofessional\s*experience\b", r"\bwork\s*history\b", r"\bjob\b",
        r"\binternship\b", r"\bposition\b", r"\bcompany\b",
        # tr
        r"\bdeneyim\w*", r"\btecrube\w*", r"\bis\s*gecmis\w*", r"\bstaj\w*",
        r"\bpozisyon\w*", r"\bsirket\w*", r"\bcalisma\s*gecmis\w*",
        # es
        r"\bexperiencia\w*", r"\blaboral\w*", r"\bempleo\w*", r"\bpracticas\b",
        # de (compound-tolerant: Berufserfahrung, Arbeitserfahrung)
        r"erfahrung\w*", r"\bberuf\w*", r"\bpraktikum\w*", r"\banstellung\w*",
        r"\btatigkeit\w*",
        # fr ("experience" already covered by en after normalization)
        r"\bprofessionnel\w*", r"\bemploi\w*", r"\bstage\b", r"\bparcours\b",
    ],
    "skills": [
        # en
        r"\bskills?\b", r"\btechnical\s*skills?\b", r"\bcore\s*competenc",
        r"\bproficienc", r"\btechnolog", r"\btools?\b", r"\bexpertise\b",
        # tr
        r"\byetenek\w*", r"\bbeceri\w*", r"\buzmanlik\w*", r"\baraclar\b",
        # es
        r"\bhabilidades\b", r"\bcompetencias\b", r"\bconocimientos\b",
        # de
        r"\bkenntnisse\b", r"\bfahigkeiten\b", r"\bkompetenzen\b",
        # fr
        r"\bcompetences?\b", r"\bsavoir[-\s]faire\b", r"\boutils\b",
    ],
    "projects": [
        # en
        r"\bprojects?\b", r"\bportfolio\b", r"\bpersonal\s*projects?\b",
        r"\bacademic\s*projects?\b", r"\bside\s*projects?\b",
        # tr
        r"\bproje\w*",
        # es
        r"\bproyectos?\b",
        # de
        r"\bprojekte?\b",
        # fr
        r"\bprojets?\b",
    ],
    "certifications": [
        # en (also covers fr "certification(s)" via prefix)
        r"\bcertificat", r"\blicens", r"\baccreditat",
        r"\bcredential\b", r"\bprofessional\s*development\b",
        # tr
        r"\bsertifika\w*", r"\bbelgeler\b", r"\bbasarilar\b",
        # es
        r"\bcertificacion\w*", r"\bcertificados?\b",
        # de
        r"\bzertifi\w*", r"\bweiterbildung\w*",
    ],
    "summary": [
        # en
        r"\bsummary\b", r"\bobjective\b", r"\bprofile\b", r"\babout\s*me\b",
        r"\bprofessional\s*summary\b", r"\bcareer\s*objective\b",
        r"\bpersonal\s*statement\b",
        # tr
        r"\bozet\w*", r"\bhakkimda\b", r"\bkariyer\s*hedef\w*", r"\bprofil\w*",
        # es
        r"\bresumen\b", r"\bperfil\b", r"\bobjetivo\b", r"\bsobre\s*mi\b",
        # de ("profil" covered above)
        r"\buber\s*mich\b",
        # fr
        r"\ba\s*propos\b", r"\bobjectif\w*",
    ],
    "languages": [
        # en
        r"\blanguages?\b", r"\bforeign\s*languages?\b",
        r"\blanguage\s*skills?\b", r"\bfluent\b",
        # tr
        r"\bdiller\b", r"\byabanci\s*dil\w*", r"\bdil\s*becerileri\b",
        # es
        r"\bidiomas?\b",
        # de
        r"\bsprach\w*",
        # fr
        r"\blangues?\b",
    ],
    "references": [
        # en
        r"\breferences?\b", r"\brecommendation", r"\breferees?\b",
        # tr
        r"\breferans\w*",
        # es
        r"\breferencias\b",
        # de
        r"\breferenzen\b",
        # fr covered by en "references" after normalization (références)
    ],
}

# Weights for completeness scoring - how important each section is.
#
# `references` is deliberately absent. Scoring it rewarded the line "References:
# available upon request", which is filler most current CV advice says to drop -
# so the product was paying people to waste a line. Its 5 points went to
# projects, which for this audience (students and early-career candidates) is
# where the real evidence lives.
SECTION_WEIGHTS: dict[str, float] = {
    "education": 20.0,
    "experience": 25.0,
    "skills": 20.0,
    "projects": 15.0,
    "certifications": 5.0,
    "summary": 10.0,
    "languages": 5.0,
}

# A heading is a short line that is essentially just its own label.
_HEADING_MAX_CHARS = 40
_HEADING_MAX_EXTRA_WORDS = 2

# "Spoken languages: Turkish (native), English (C1)" - a section written as a
# labelled line rather than a heading with a block under it.
_INLINE_LABEL_MAX_CHARS = 30
_MIN_INLINE_CONTENT = 10

# A heading with nothing under it is not a section.
_MIN_SECTION_CONTENT = 15

_WORD_RE = re.compile(r"[a-z0-9]+")


def _match_section(line: str) -> str | None:
    """The section whose synonyms appear in `line`, or None."""
    for section_name, patterns in SECTION_PATTERNS.items():
        if any(re.search(p, line) for p in patterns):
            return section_name
    return None


def _is_bare_heading(line: str, section_name: str) -> bool:
    """True when the line is essentially just the section's label.

    "SKILLS" and "PROFESSIONAL SUMMARY" are headings. "I can provide references
    on request" is a sentence that happens to contain the word.
    """
    stripped = line.strip()
    if not stripped or len(stripped) > _HEADING_MAX_CHARS:
        return False

    # Drop the words the pattern itself matched, then see what is left over.
    remainder = stripped
    for pattern in SECTION_PATTERNS[section_name]:
        remainder = re.sub(pattern, " ", remainder)
    return len(_WORD_RE.findall(remainder)) <= _HEADING_MAX_EXTRA_WORDS


def _inline_label_content(line: str, section_name: str) -> str | None:
    """Content of a "Label: value" line, when the line is written that way.

    Covers sections given as a single labelled line rather than a heading with a
    block beneath it, e.g. "Spoken languages: Turkish (native), English (C1)".
    """
    if ":" not in line:
        return None
    label, _, value = line.partition(":")
    if len(label.strip()) > _INLINE_LABEL_MAX_CHARS:
        return None
    if _match_section(label) != section_name:
        return None
    value = value.strip()
    return value if len(value) >= _MIN_INLINE_CONTENT else None


class SectionDetector(BaseAnalyzer):
    """Detects standard CV sections from headings and the content beneath them.

    This used to search the whole document for a section's keyword, anywhere, in
    any context. So the single sentence

        "I can provide references on request and my education is ongoing."

    scored 50% completeness - education, experience and references all "found",
    with not one real section in the document. The same leniency meant the two
    lines "REFERENCES / Available upon request" were worth a full 5 points.

    A section now requires a heading AND something under it, so the score
    measures what the CV contains rather than which words it happens to use.
    """

    @property
    def name(self) -> str:
        return "Section Detector"

    def _detect(self, text_normalized: str) -> dict[str, bool]:
        lines = text_normalized.split("\n")
        detected = {name: False for name in SECTION_PATTERNS}

        # Where each heading sits, so the content between two headings can be
        # attributed to the first of them.
        headings: list[tuple[int, str]] = []
        for i, line in enumerate(lines):
            section_name = _match_section(line)
            if section_name is None:
                continue

            # A labelled line carries its own content and needs nothing below.
            if _inline_label_content(line, section_name):
                detected[section_name] = True
                continue

            if _is_bare_heading(line, section_name):
                headings.append((i, section_name))

        for position, (index, section_name) in enumerate(headings):
            next_index = (
                headings[position + 1][0] if position + 1 < len(headings) else len(lines)
            )
            body = " ".join(lines[index + 1:next_index]).strip()
            if len(body) >= _MIN_SECTION_CONTENT:
                detected[section_name] = True

        return detected

    def analyze(self, context: AnalysisContext) -> None:
        # Match against the diacritic-folded text so all 5 UI languages score
        # on equal footing (and PDF extractors that mangle diacritics don't
        # hurt either).
        detected = self._detect(context.text_normalized)

        total_weight = sum(SECTION_WEIGHTS.values())
        earned_weight = sum(
            SECTION_WEIGHTS.get(name, 0.0) for name, found in detected.items() if found
        )

        context.detected_sections = detected
        context.completeness_score = round((earned_weight / total_weight) * 100, 1)

        logger.info(
            f"Detected {sum(detected.values())}/{len(detected)} sections, "
            f"completeness={context.completeness_score}%"
        )
