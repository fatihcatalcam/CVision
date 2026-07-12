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

# Weights for completeness scoring - how important each section is
SECTION_WEIGHTS: dict[str, float] = {
    "education": 20.0,
    "experience": 25.0,
    "skills": 20.0,
    "projects": 10.0,
    "certifications": 5.0,
    "summary": 10.0,
    "languages": 5.0,
    "references": 5.0,
}


class SectionDetector(BaseAnalyzer):
    """Detects standard CV sections via keyword/synonym matching."""

    @property
    def name(self) -> str:
        return "Section Detector"

    def analyze(self, context: AnalysisContext) -> None:
        # Match against the diacritic-folded text so all 5 UI languages score
        # on equal footing (and PDF extractors that mangle diacritics don't
        # hurt either).
        text_normalized = context.text_normalized
        detected = {}
        total_weight = sum(SECTION_WEIGHTS.values())
        earned_weight = 0.0

        for section_name, patterns in SECTION_PATTERNS.items():
            found = any(re.search(p, text_normalized) for p in patterns)
            detected[section_name] = found

            if found:
                earned_weight += SECTION_WEIGHTS.get(section_name, 0.0)
                logger.debug(f"Section detected: {section_name}")
            else:
                logger.debug(f"Section NOT detected: {section_name}")

        context.detected_sections = detected
        context.completeness_score = round((earned_weight / total_weight) * 100, 1)

        logger.info(
            f"Detected {sum(detected.values())}/{len(detected)} sections, "
            f"completeness={context.completeness_score}%"
        )
