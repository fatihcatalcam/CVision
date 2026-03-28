"""
Section Detector — identifies standard CV sections using keyword/synonym matching.
Detects: education, experience, skills, projects, certifications, summary/objective, languages, references.
Contributes to the completeness score.
"""

import logging
import re

from app.analysis.base_analyzer import BaseAnalyzer, AnalysisContext

logger = logging.getLogger("cvision.analysis.section_detector")

# Section definitions: section_name -> list of keyword patterns (case-insensitive)
SECTION_PATTERNS: dict[str, list[str]] = {
    "education": [
        r"\beducation\b", r"\bacademic\b", r"\buniversity\b", r"\bcollege\b",
        r"\bdegree\b", r"\bbachelor\b", r"\bmaster\b", r"\bphd\b", r"\bdiploma\b",
        r"\bgpa\b", r"\bschool\b", r"\bgraduat", r"\beğitim\b", r"\blise\b",
        r"\büniversite\b", r"\bokul\b", r"\bmezuniyet\b", r"\bakademi\b",
        r"\blisans\b", r"\byüksek\s*lisans\b",
    ],
    "experience": [
        r"\bexperience\b", r"\bwork\s*experience\b", r"\bemployment\b",
        r"\bprofessional\s*experience\b", r"\bwork\s*history\b", r"\bjob\b",
        r"\binternship\b", r"\bposition\b", r"\bcompany\b", r"\bdeneyim\b",
        r"\btecrübe\b", r"\biş\s*geçmişi\b", r"\bstaj\b", r"\bpozisyon\b",
        r"\bşirket\b", r"\bçalışma\s*geçmişi\b",
    ],
    "skills": [
        r"\bskills?\b", r"\btechnical\s*skills?\b", r"\bcore\s*competenc",
        r"\bproficienc", r"\btechnolog", r"\btools?\b", r"\bexpertise\b",
        r"\byetenekler\b", r"\bbeceriler\b", r"\buzmanlıklar\b",
        r"\bteknik\s*beceriler\b", r"\baraçlar\b",
    ],
    "projects": [
        r"\bprojects?\b", r"\bportfolio\b", r"\bpersonal\s*projects?\b",
        r"\bacademic\s*projects?\b", r"\bside\s*projects?\b", r"\bprojeler\b",
        r"\bkişisel\s*projeler\b",
    ],
    "certifications": [
        r"\bcertificat", r"\blicens", r"\baccreditat",
        r"\bcredential\b", r"\bprofessional\s*development\b", r"\bsertifikalar\b",
        r"\bbelgeler\b", r"\blisanslar\b", r"\bbaşarılar\b",
    ],
    "summary": [
        r"\bsummary\b", r"\bobjective\b", r"\bprofile\b", r"\babout\s*me\b",
        r"\bprofessional\s*summary\b", r"\bcareer\s*objective\b",
        r"\bpersonal\s*statement\b", r"\bözet\b", r"\bhakkımda\b",
        r"\bkariyer\s*hedefi\b", r"\bprofil\b",
    ],
    "languages": [
        r"\blanguages?\b", r"\bforeign\s*languages?\b",
        r"\blanguage\s*skills?\b", r"\bfluent\b", r"\bdiller\b",
        r"\byabancı\s*dil\b",
    ],
    "references": [
        r"\breferences?\b", r"\brecommendation", r"\breferees?\b",
        r"\breferanslar\b",
    ],
}

# Weights for completeness scoring — how important each section is
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
        text_lower = context.text_lower
        detected = {}
        total_weight = sum(SECTION_WEIGHTS.values())
        earned_weight = 0.0

        for section_name, patterns in SECTION_PATTERNS.items():
            found = any(re.search(p, text_lower) for p in patterns)
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
