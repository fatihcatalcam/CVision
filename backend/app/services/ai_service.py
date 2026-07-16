"""
AI Service - wraps OpenAI GPT API to enhance CV analysis results.

Provides:
- AI-powered CV summary and executive narrative
- Smart, personalized suggestion generation
- "Fix My CV" rewrite for individual bullet points
- Language-aware (detects all 5 UI languages: en/tr/es/de/fr, diacritic-robust)
- Domain-aware personas covering every seeded role-profile domain
- Anti-hallucination guardrails (never fabricates metrics; uses bracket placeholders)
- Structured Outputs via Pydantic for zero JSON-parse errors
- Prompt-caching-friendly layout (stable system prompt > 1KB) for cost savings
- Smart CV truncation (preserves experience section, not just first N chars)

Falls back gracefully if API key is missing, the SDK is too old, or the call fails.
"""

import json
import logging
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.config import settings

logger = logging.getLogger("cvision.services.ai")


# ============================================================
# Pydantic schemas for OpenAI Structured Outputs
# ============================================================

class Suggestion(BaseModel):
    """A single AI-generated CV improvement suggestion."""

    category: Literal["experience", "skills", "content", "formatting", "ats"]
    priority: Literal["high", "medium", "low"]
    message: str = Field(
        description=(
            "Specific, actionable suggestion that references actual CV content. "
            "Never generic advice."
        )
    )
    rewrite_hint: str = Field(
        description=(
            "Before/After example quoting CV content. Empty string if not applicable "
            "(e.g. for purely structural suggestions)."
        )
    )


# Every domain present in role_profiles_data.py, plus "Other". detected_domain
# must be one of these so downstream role filtering can trust it. The AI picks
# from this list, so a domain missing here is invisible: its roles can never be
# recommended. test_known_domains_cover_every_seeded_domain keeps the two in
# sync - they drifted silently before, which is why the taxonomy could grow
# without the AI ever noticing.
KNOWN_DOMAINS = [
    "Software Engineering", "Data & Analytics", "Industrial Engineering",
    "Mechanical Engineering", "Electrical Engineering", "Civil Engineering",
    "Business & Management", "Marketing & Communications",
    "Finance & Accounting", "Healthcare & Biomedical",
    "Environmental & Energy", "Cybersecurity", "UX / UI Design",
    "Media & Creative", "Journalism & Broadcasting", "Legal", "Education",
    "Healthcare & Clinical", "Sales & Business Development",
    "Hospitality & Tourism", "Architecture & Design",
    "Skilled Trades & Technical", "Public Sector & NGO",
]


class CVAnalysis(BaseModel):
    """Structured output schema for the full CV analysis call."""

    executive_summary: str = Field(
        description="2-3 sentence honest executive summary of the CV's overall quality."
    )
    strengths: list[str] = Field(description="Exactly 3 specific strengths.")
    weaknesses: list[str] = Field(description="Exactly 3 specific weaknesses.")
    ai_suggestions: list[Suggestion] = Field(description="4-6 actionable suggestions.")
    detected_domain: str = Field(
        description=(
            "The professional field this CV actually belongs to, judged from its "
            "content. Choose EXACTLY one of: "
            + "; ".join(KNOWN_DOMAINS)
            + "; Other. Use 'Other' only when none of the listed fields fit."
        )
    )


class GapItem(BaseModel):
    """A single gap between the CV and the job description."""
    category: Literal["skills", "experience", "education", "keywords", "other"]
    priority: Literal["high", "medium", "low"]
    description: str = Field(description="What is missing and why it matters for this role.")
    suggestion: str = Field(description="Concrete action the candidate can take to address this gap.")


class JDMatchOutput(BaseModel):
    """Structured output schema for CV vs JD matching."""
    match_score: int = Field(ge=0, le=100, description="Realistic recruiter match score 0-100.")
    summary: str = Field(description="2-3 sentence honest assessment of fit.")
    matched_keywords: list[str] = Field(description="Keywords/skills present in both CV and JD.")
    missing_keywords: list[str] = Field(description="Important keywords in JD missing from CV.")
    gap_analysis: list[GapItem] = Field(description="3-6 gaps ordered high→medium→low priority.")


# ============================================================
# Domain-specific personas
# Keys are normalized: lowercase, spaces/punctuation -> underscore.
# Covers every seeded domain in role_profiles_data.py; a domain without an
# entry falls back to DEFAULT_PERSONA rather than failing.
# ============================================================

DEFAULT_PERSONA = (
    "You are a senior career consultant and CV expert with 15+ years of experience "
    "helping candidates land jobs at top companies. You give brutally honest but "
    "constructive feedback. You understand both Turkish and English CVs deeply."
)

DOMAIN_PERSONAS: dict[str, str] = {
    "software_engineering": (
        "You are a senior tech recruiter who has hired 200+ engineers at FAANG-tier "
        "companies. You evaluate technical depth (system design, scale of systems "
        "shipped), ownership signals (architecture decisions, on-call, mentoring), "
        "and quantified impact (latency reductions, cost savings, throughput, uptime)."
    ),
    "data_&_analytics": (
        "You are a senior data science / analytics recruiter at a top tech company. "
        "You evaluate model deployment to production, business impact (revenue lifted, "
        "churn reduced), experimentation rigor (A/B test design, causal inference), "
        "and breadth of ML/stats/SQL tooling. Vague 'analyzed data' claims are red flags."
    ),
    "cybersecurity": (
        "You are a senior security recruiter at a Fortune-500 company. You evaluate "
        "incident response experience, threat modeling, hands-on tooling (SIEM, EDR, "
        "pen-test frameworks), certifications (OSCP/CISSP/etc.), and concrete defensive "
        "wins (vulnerabilities found, MTTR reduced, compliance audits passed)."
    ),
    "industrial_engineering": (
        "You are a senior industrial engineering recruiter at a manufacturing or "
        "supply chain leader. You evaluate process optimization wins (cycle time, "
        "waste reduction, OEE), Lean/Six Sigma certifications, ERP/MES experience, "
        "and quantified cost or throughput improvements."
    ),
    "mechanical_engineering": (
        "You are a senior mechanical engineering recruiter at a product or industrial "
        "company. You evaluate CAD depth (SolidWorks, CATIA), FEA/CFD work, "
        "manufacturing-method awareness (DFM/DFA), tolerance analysis, and shipped "
        "products the candidate owned end-to-end."
    ),
    "electrical_engineering": (
        "You are a senior electrical engineering recruiter at a hardware or energy "
        "company. You evaluate PCB design depth, signal integrity work, embedded/"
        "firmware exposure, power electronics, lab equipment fluency, and projects "
        "that actually shipped to customers."
    ),
    "civil_engineering": (
        "You are a senior civil engineering recruiter at a major contractor or "
        "consultancy. You evaluate project scale (budget, timeline, team), "
        "structural/geotechnical/transport specialization, BIM/AutoCAD/Revit fluency, "
        "code compliance work, and on-site delivery experience."
    ),
    "business_&_management": (
        "You are a senior management recruiter at a top consultancy or corporate "
        "strategy team. You evaluate scope of ownership (P&L size, team size), "
        "strategic frameworks applied, cross-functional leadership signals, and "
        "measurable business outcomes (revenue, cost, growth)."
    ),
    "marketing_&_communications": (
        "You are a senior marketing recruiter who hires growth and brand leads. "
        "You evaluate channel ownership, funnel metrics (CAC/LTV/CTR/CVR), brand "
        "and content work, attribution modeling, and revenue impact directly "
        "attributable to the candidate."
    ),
    "finance_&_accounting": (
        "You are a senior finance recruiter at a top-tier bank or corporate finance "
        "team. You evaluate deal experience (size, sector), modeling sophistication "
        "(LBO, DCF, M&A, three-statement), audit/controllership depth, and the rigor "
        "of analytical work backing decisions."
    ),
    "healthcare_&_biomedical": (
        "You are a senior healthcare/biomedical recruiter at a hospital network, "
        "device manufacturer, or biotech. You evaluate clinical experience, "
        "regulatory awareness (FDA, CE, ISO 13485), research output (publications, "
        "trials), and patient/clinical-outcome impact."
    ),
    "environmental_&_energy": (
        "You are a senior recruiter at a sustainability, renewable energy, or "
        "environmental consultancy. You evaluate technical depth in energy systems "
        "or environmental assessment, regulatory experience (EIA, ESG frameworks), "
        "and measurable sustainability outcomes the candidate drove."
    ),
    "ux_/_ui_design": (
        "You are a senior design recruiter at a product-led company. You evaluate "
        "portfolio depth, end-to-end process (research -> ship -> measure), "
        "cross-functional collaboration with PM and engineering, design-systems "
        "experience, and quantified product impact of the candidate's design work."
    ),
    "media_&_creative": (
        "You are a senior producer who hires for production houses and in-house "
        "content teams. You evaluate the reel or portfolio first, then craft depth "
        "(which tools, which formats, which delivery specs), the scale and reach of "
        "what shipped, and whether the candidate owned a piece end to end or only "
        "assisted. Credits and named productions matter more than adjectives."
    ),
    "journalism_&_broadcasting": (
        "You are a newsroom editor who hires reporters and producers. You evaluate "
        "published clips and bylines, beat expertise, sourcing and verification "
        "discipline, output under deadline, and reach or impact of the work. Vague "
        "claims about 'strong writing' count for nothing without the clips."
    ),
    "legal": (
        "You are a hiring partner at a law firm or a head of legal in-house. You "
        "evaluate practice-area depth, the substance and value of matters handled, "
        "bar admission and qualifications, drafting and negotiation evidence, and "
        "whether the candidate advised or merely supported."
    ),
    "education": (
        "You are a school principal or head of learning and development. You "
        "evaluate subject and grade-level expertise, curriculum and assessment "
        "design, measurable learner outcomes, certifications, and classroom or "
        "cohort scale. Publications matter for academic candidates."
    ),
    "healthcare_&_clinical": (
        "You are a clinical recruiter at a hospital. You evaluate licensure and "
        "registration first, then specialty and setting (ward, ICU, outpatient), "
        "patient volume and case mix, certifications (BLS, ACLS), and evidence of "
        "safe practice. Unverifiable clinical claims are a serious red flag."
    ),
    "sales_&_business_development": (
        "You are a sales director who hires closers. You evaluate numbers above all: "
        "quota and attainment, deal size, cycle length, territory, and named logos. "
        "A sales CV without figures is the single biggest credibility failure in "
        "this field."
    ),
    "hospitality_&_tourism": (
        "You are a hotel or restaurant group operations director. You evaluate "
        "property or outlet size, covers and occupancy handled, guest-satisfaction "
        "and revenue metrics, systems experience, food-safety credentials, and team "
        "size led."
    ),
    "architecture_&_design": (
        "You are a principal at an architecture or design practice. You evaluate the "
        "portfolio first, then project types and scale, which RIBA-equivalent stages "
        "the candidate actually worked on, software depth, licensure, and whether "
        "buildings or products were genuinely delivered rather than only rendered."
    ),
    "skilled_trades_&_technical": (
        "You are a plant or workshop manager who hires technicians. You evaluate "
        "certifications and tickets first, then equipment and systems worked on, "
        "safety record, fault-finding ability, tolerances and standards met, and "
        "downtime or reliability improvements. Certificates beat adjectives."
    ),
    "public_sector_&_ngo": (
        "You are a programme director at a public body or NGO. You evaluate "
        "programme scale and budget, donor and funder experience, monitoring and "
        "evaluation rigour, beneficiary outcomes, and compliance and reporting "
        "discipline. Impact numbers matter more than mission statements."
    ),
}


def _persona_for_domain(target_domain: str | None) -> str:
    """Match raw domain string to a persona; fall back to default."""
    if not target_domain or target_domain.lower().strip() == "other":
        return DEFAULT_PERSONA
    key = target_domain.lower().strip().replace(" ", "_").replace("-", "_")
    return DOMAIN_PERSONAS.get(key, DEFAULT_PERSONA)


# ============================================================
# Static, cacheable instructions
# Kept verbose & stable so OpenAI auto-caches the system prefix (>=1024 tokens).
# Edit with care: changing this invalidates the prompt cache.
# ============================================================

OUTPUT_RULES = """OUTPUT RULES:
1. Return EXACTLY 3 strengths and EXACTLY 3 weaknesses - no more, no less.
2. Return 4 to 6 ai_suggestions.
3. Every `message` MUST reference SPECIFIC content from THIS CV (quote a phrase,
   reference a job title or company, mention a listed skill). Generic advice is a
   failed output.
4. `rewrite_hint` format when applicable:
   "Before: [exact quote from CV] -> After: [improved version, max 2 lines]"
   If the suggestion is structural (formatting, section order, length), use "".
5. NEVER fabricate metrics, percentages, team sizes, revenue, or any numbers that
   are not in the CV. If you suggest adding quantification, use bracket
   placeholders the candidate fills in:
     - "[X%]" for percentages
     - "[N users]" / "[N customers]" for scale
     - "[Xms -> Yms]" for performance deltas
6. Use strong action verbs: Led, Architected, Shipped, Reduced, Owned, Scaled,
   Launched, Delivered, Drove, Built.
   BANNED weak verbs: "worked on", "helped with", "responsible for",
   "assisted with", "participated in", "involved with".
7. Strengths and weaknesses must each be one tight sentence under 25 words.
8. Write executive_summary, strengths, weaknesses, and suggestion messages in
   the SAME language as the CV (detected language is provided in the user prompt).
9. Set detected_domain to the professional field this CV actually belongs to,
   judged from its content (NOT from the user's selection). Choose EXACTLY one:
   Software Engineering; Data & Analytics; Industrial Engineering; Mechanical
   Engineering; Electrical Engineering; Civil Engineering; Business & Management;
   Marketing & Communications; Finance & Accounting; Healthcare & Biomedical;
   Environmental & Energy; Cybersecurity; UX / UI Design; Other.
   Use 'Other' only when none of these fields fit.

EXAMPLE OF A BAD SUGGESTION (do NOT do this):
  {
    "category": "experience",
    "priority": "high",
    "message": "Add more quantification to your bullets.",
    "rewrite_hint": ""
  }
  Why bad: generic, not tied to any specific bullet in the CV.

EXAMPLE OF A GOOD SUGGESTION:
  {
    "category": "experience",
    "priority": "high",
    "message": "Your bullet 'Optimized API endpoints' has zero quantified impact and uses a vague verb. This is the most common reason hiring managers skim past senior backend candidates.",
    "rewrite_hint": "Before: 'Optimized API endpoints' -> After: 'Reduced p95 latency on /search from [X]ms to [Y]ms by introducing Redis-backed caching, serving [N] req/s in production.'"
  }
  Why good: quotes the CV, names the failure mode, gives a fillable template
  with bracket placeholders instead of fabricated numbers.

EXAMPLE OF A GOOD FORMATTING SUGGESTION (no rewrite_hint needed):
  {
    "category": "formatting",
    "priority": "medium",
    "message": "Your 'Skills' section lists 47 technologies as a flat comma-separated wall. Recruiters scan in F-pattern - this layout costs you 6-8 seconds of their attention and signals junior-level CV craft.",
    "rewrite_hint": ""
  }
  Why good: identifies the specific section ('Skills'), names the count (verified
  from the CV, not fabricated), explains the underlying mechanism (F-pattern
  scanning), and leaves rewrite_hint empty because the fix is structural.

EXAMPLE OF A GOOD SKILLS SUGGESTION:
  {
    "category": "skills",
    "priority": "high",
    "message": "You list 'leadership' and 'communication' as skills but show no evidence in your bullets - no team size, no cross-functional projects, no presentations. Soft skills without proof read as filler.",
    "rewrite_hint": "Before: 'Skills: leadership, communication' -> After: Move these into experience bullets, e.g. 'Led [N]-engineer team through [project]' and 'Presented [outcome] to [audience size].'"
  }
  Why good: cites two specific listed skills, names a concrete failure pattern
  (claims without evidence), and the rewrite_hint shows HOW to fix it with
  bracket placeholders for the candidate to fill in.

SELF-CHECK BEFORE RESPONDING:
- Did each suggestion reference a SPECIFIC quote, section, skill, role, or
  company from the CV? (If no, rewrite the suggestion.)
- Did you invent any number, percentage, team size, or metric not in the CV?
  (If yes, replace with a [bracketed] placeholder.)
- Are strengths and weaknesses exactly 3 items each? (If no, fix the count.)
- Did you use any banned weak verb? (If yes, swap for a strong action verb.)
- Are you writing in the same language as the CV? (If no, switch.)"""


# ============================================================
# Public API
# ============================================================

def _get_client():
    """Lazily create the OpenAI client to avoid import errors if key is missing."""
    try:
        from openai import OpenAI
        return OpenAI(api_key=settings.OPENAI_API_KEY)
    except Exception as e:
        logger.error(f"Failed to create OpenAI client: {e}")
        return None


def is_ai_enabled() -> bool:
    """Check if AI is available and configured."""
    return bool(settings.OPENAI_API_KEY and settings.OPENAI_ENABLED)


# Distinctive CV vocabulary per language, in normalized (diacritic-folded)
# form so PDF extractors that mangle "eğitim" into "egitim" don't break
# detection. Ambiguous cross-language words (universite, profil, references,
# experience==fr experience) are deliberately left out or kept en-only.
_LANG_KEYWORDS: dict[str, list[str]] = {
    "tr": [
        "deneyim", "egitim", "beceri", "yetenek", "hakkimda", "iletisim",
        "mezun", "staj", "bolum", "lisans", "ozet", "sertifika",
        "referanslar", "amac", "hedef", "calisma", "gorev", "sorumluluk",
        "yazilim", "muhendis", "kidemli", "gelistir",
    ],
    "es": [
        "experiencia", "educacion", "formacion", "habilidades",
        "conocimientos", "universidad", "practicas", "resumen", "objetivo",
        "proyectos", "idiomas", "referencias", "laboral", "empleo",
        "trabajo", "logros", "desarroll",
    ],
    "de": [
        "erfahrung", "ausbildung", "kenntnisse", "fahigkeiten",
        "hochschule", "universitat", "praktikum", "projekte", "sprachen",
        "referenzen", "beruf", "studium", "abschluss", "zusammenfassung",
        "entwickelt", "zeugnis",
    ],
    "fr": [
        "formation", "competences", "stage", "langues", "professionnelle",
        "diplome", "objectif", "projets", "emploi", "parcours",
        "developpe", "realise", "a propos", "maitrise",
    ],
    "en": [
        "experience", "education", "skills", "summary", "university",
        "projects", "languages", "employment", "degree", "professional",
        "achievements", "developed", "work history",
    ],
}

LANGUAGE_NAMES: dict[str, str] = {
    "en": "English", "tr": "Turkish", "es": "Spanish",
    "de": "German", "fr": "French",
}


def detect_language(text: str) -> str:
    """
    Heuristically detect the CV's primary language across the five
    supported UI languages. Returns 'en', 'tr', 'es', 'de' or 'fr'
    (defaults to 'en' when the signal is weak).
    """
    from app.analysis.text_utils import normalize_text

    text_norm = normalize_text(text)
    counts = {
        lang: sum(1 for kw in kws if kw in text_norm)
        for lang, kws in _LANG_KEYWORDS.items()
    }
    best_lang = max(counts, key=lambda k: counts[k])
    # A non-English language must have a clear signal (>=3 hits) AND beat
    # English (tech CVs are full of English loanwords either way).
    if best_lang != "en" and counts[best_lang] >= 3 and counts[best_lang] >= counts["en"]:
        return best_lang
    return "en"


def language_name(lang: str) -> str:
    """Human-readable language name for prompt directives."""
    return LANGUAGE_NAMES.get(lang, "English")


def _smart_truncate(cv_text: str, max_chars: int = 4000) -> str:
    """
    Smarter truncation than `cv_text[:N]`:
    - Always keep the first 500 chars (header / contact / summary).
    - If the experience section is found later, anchor the body there so that
      middle-of-CV experience is not silently dropped.
    - Falls back to plain truncation only if no anchor is found.
    """
    if len(cv_text) <= max_chars:
        return cv_text

    header = cv_text[:500]
    body_budget = max_chars - len(header) - 50  # 50 chars for the separator
    lower = cv_text.lower()

    # Order matters: longer/more-specific markers first so that "work experience"
    # wins over a bare "experience" mid-summary. Falls through to short markers.
    # Covers all 5 UI languages (accented and PDF-mangled unaccented variants).
    anchor_markers = [
        "professional experience", "work experience", "career history",
        "iş tecrübesi", "profesyonel deneyim", "iş deneyim", "iş geçmişi",
        "çalışma geçmişi", "is tecrubesi", "is deneyim", "is gecmisi",
        "experiencia laboral", "experiencia profesional",
        "expérience professionnelle", "experience professionnelle",
        "parcours professionnel",
        "berufserfahrung", "arbeitserfahrung", "berufspraxis",
        "employment", "experience", "deneyim", "experiencia", "erfahrung",
    ]
    for marker in anchor_markers:
        idx = lower.find(marker)
        if idx > 500:
            # Back up to the start of that line so the section heading is intact.
            line_start = cv_text.rfind("\n", 0, idx) + 1
            anchor = line_start if line_start > 500 else idx
            return f"{header}\n\n[...]\n\n{cv_text[anchor:anchor + body_budget]}"

    return cv_text[:max_chars]


def _build_system_prompt(target_domain: str | None) -> str:
    """Static, cache-friendly system prompt: persona + rules + examples."""
    persona = _persona_for_domain(target_domain)
    return (
        f"{persona}\n\n"
        f"{OUTPUT_RULES}\n\n"
        "Respond by populating the structured-output schema. Do not include "
        "markdown, prose, or extra commentary outside the schema fields."
    )


def _build_user_prompt(
    cv_text: str,
    scores: dict,
    target_domain: str | None,
    role_profiles: list[dict] | None,
    rule_based_suggestions: list[dict],
    lang_name: str,
    extracted_skills: list[str] | None = None,
    missing_sections: list[str] | None = None,
) -> str:
    """Dynamic user prompt: CV body + scores + matched roles + existing issues."""
    cv_preview = _smart_truncate(cv_text, max_chars=4000)

    score_context = (
        f"Overall: {scores.get('overall_score', 0):.0f}%, "
        f"ATS: {scores.get('ats_score', 0):.0f}%, "
        f"Keyword Match: {scores.get('keyword_score', 0):.0f}%, "
        f"Completeness: {scores.get('completeness_score', 0):.0f}%, "
        f"Experience: {scores.get('experience_score', 0):.0f}%"
    )

    role_lines: list[str] = []
    if target_domain:
        if target_domain.lower().strip() == "other":
            role_lines.append(
                "Target Domain: [Unknown / Other]. Deduce the candidate's primary "
                "profession from the CV itself and evaluate as an expert recruiter "
                "in that field."
            )
        else:
            role_lines.append(f"Target Domain: {target_domain}")
    if role_profiles and target_domain and target_domain.lower().strip() != "other":
        top_roles = [p.get("title", "") for p in role_profiles[:3] if p.get("title")]
        if top_roles:
            role_lines.append(f"Best Matching Roles: {', '.join(top_roles)}")
    role_context = "\n".join(role_lines) if role_lines else "Target Domain: (none specified)"

    existing_issues = json.dumps(
        [s.get("message", "") for s in rule_based_suggestions[:5]],
        ensure_ascii=False,
    )

    # Ground the model in what the deterministic engine actually found, so
    # suggestions reference verified facts instead of re-deriving (or
    # hallucinating) them from the truncated CV text.
    findings_lines: list[str] = []
    if extracted_skills:
        findings_lines.append(
            f"Verified skills detected in the CV: {', '.join(extracted_skills[:15])}"
        )
    if missing_sections:
        findings_lines.append(
            f"Sections NOT detected in the CV (suggesting these is high-value): "
            f"{', '.join(missing_sections)}"
        )
    findings_context = (
        "ENGINE FINDINGS (verified facts — use them):\n" + "\n".join(findings_lines) + "\n\n"
        if findings_lines else ""
    )

    return (
        f"Analyze this CV and produce the structured output.\n\n"
        f"CV LANGUAGE: {lang_name} (write all natural-language fields in {lang_name})\n\n"
        f"CV TEXT:\n\"\"\"\n{cv_preview}\n\"\"\"\n\n"
        f"SCORING DATA:\n{score_context}\n"
        f"{role_context}\n\n"
        f"{findings_context}"
        f"EXISTING RULE-BASED ISSUES (do NOT duplicate; either build on them with "
        f"deeper specificity, or surface different issues these miss):\n{existing_issues}\n\n"
        f"REMINDER: Write ALL natural-language output in {lang_name}. The examples "
        f"in your instructions are FORMAT templates only — never copy their "
        f"language or their software-specific content; adapt to this CV's "
        f"language and domain."
    )


class SkillNormalization(BaseModel):
    """Canonical skill names the AI recognised in a CV, in any language."""

    skills: list[str] = Field(
        description=(
            "Skills the CV demonstrates, given ONLY as names copied EXACTLY "
            "from the provided vocabulary. Never invent a name, never "
            "translate one, never return a name absent from the vocabulary."
        )
    )


def ai_normalize_skills(
    cv_text: str,
    vocabulary: list[str],
) -> list[str] | None:
    """Map a CV in ANY language onto canonical English skill names.

    This is the fix for the language penalty: the seed dictionary is entirely
    English, so a Turkish CV writing "iletisim" or "takim calismasi" scored
    nothing for Communication or Teamwork, while its English twin scored both.
    Rather than translating ~800 dictionary entries into five languages, the
    model reads meaning and answers in our vocabulary.

    The caller merges the result with the regex extractor rather than replacing
    it, so a None return (AI off, quota gone, API down, malformed reply) simply
    leaves the pipeline at its regex-only behaviour.

    Returns:
        Canonical skill names, or None on any failure. Never raises.
    """
    if not is_ai_enabled():
        return None

    client = _get_client()
    if client is None:
        return None

    # The vocabulary is a static prefix, so it sits at the top of the system
    # prompt where OpenAI's prompt caching can reuse it across requests.
    system_prompt = (
        "You extract skills from CVs.\n\n"
        "VOCABULARY (the ONLY valid answers, copy names character-for-character):\n"
        + ", ".join(vocabulary)
        + "\n\nRules:\n"
        "1. The CV may be in ANY language. Map what it demonstrates onto the "
        "vocabulary above. A Turkish CV saying 'iletisim becerilerim guclu' "
        "demonstrates 'Communication'. 'Takim calismasi' is 'Teamwork'.\n"
        "2. Return a name ONLY if the CV genuinely evidences that skill. Do "
        "not guess from job titles alone.\n"
        "3. Never return a name that is not in the vocabulary, character for "
        "character. Never invent, translate or pluralise names.\n"
        "4. Prefer precision over recall: a wrong skill corrupts the score."
    )

    try:
        response = client.beta.chat.completions.parse(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": cv_text[:12000]},
            ],
            response_format=SkillNormalization,
            temperature=0,
        )
        parsed = response.choices[0].message.parsed
        if parsed is None:
            logger.warning("Skill normalization returned None; regex only.")
            return None
        logger.info(f"AI normalized {len(parsed.skills)} skills from CV text.")
        return parsed.skills
    except Exception as e:
        # Never fail the analysis over this: the regex extractor still runs.
        logger.warning(f"Skill normalization failed ({e}); regex only.")
        return None


def ai_enhance_analysis(
    cv_text: str,
    rule_based_suggestions: list[dict],
    scores: dict,
    target_domain: str | None = None,
    role_profiles: list[dict] | None = None,
    extracted_skills: list[str] | None = None,
    missing_sections: list[str] | None = None,
) -> dict[str, Any]:
    """
    Use GPT to produce AI-enhanced CV analysis output.

    Returns:
        Dict with keys: executive_summary, strengths, weaknesses, ai_suggestions.
        Returns empty dict on failure (caller falls back to rule-based output).
    """
    if not is_ai_enabled():
        logger.info("AI service disabled - using rule-based output only.")
        return {}

    client = _get_client()
    if not client:
        return {}

    lang = detect_language(cv_text)
    lang_name = language_name(lang)

    system_prompt = _build_system_prompt(target_domain)
    user_prompt = _build_user_prompt(
        cv_text=cv_text,
        scores=scores,
        target_domain=target_domain,
        role_profiles=role_profiles,
        rule_based_suggestions=rule_based_suggestions,
        lang_name=lang_name,
        extracted_skills=extracted_skills,
        missing_sections=missing_sections,
    )

    logger.info(
        f"Calling OpenAI (model={settings.OPENAI_MODEL}, lang={lang}, "
        f"domain={target_domain})"
    )

    # ---- Preferred path: Structured Outputs (OpenAI SDK >= 1.40) ----
    try:
        response = client.beta.chat.completions.parse(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.4,
            max_tokens=1500,
            response_format=CVAnalysis,
        )
        parsed = response.choices[0].message.parsed
        if parsed is not None:
            result = parsed.model_dump()
            logger.info(
                f"AI enhancement OK (structured) - "
                f"{len(result.get('ai_suggestions', []))} suggestions"
            )
            return result
        logger.warning("Structured parse returned None; falling back to JSON mode.")
    except AttributeError:
        # SDK too old for .beta.chat.completions.parse
        logger.warning("OpenAI SDK does not support Structured Outputs; using JSON mode.")
    except Exception as e:
        logger.error(f"Structured Outputs call failed: {e}; falling back to JSON mode.")

    # ---- Fallback path: classic JSON mode ----
    return _fallback_json_mode(client, system_prompt, user_prompt)


def _fallback_json_mode(
    client,
    system_prompt: str,
    user_prompt: str,
) -> dict[str, Any]:
    """Backup path when Structured Outputs is unavailable or fails."""
    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": (
                        user_prompt
                        + "\n\nReturn ONLY a valid JSON object matching the schema "
                        "(executive_summary, strengths, weaknesses, ai_suggestions, "
                        "detected_domain). No markdown, no extra text."
                    ),
                },
            ],
            temperature=0.4,
            max_tokens=1500,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
        result = json.loads(raw)
        logger.info(
            f"AI enhancement OK (json_object fallback) - "
            f"{len(result.get('ai_suggestions', []))} suggestions"
        )
        return result
    except json.JSONDecodeError as e:
        logger.error(f"Fallback returned invalid JSON: {e}")
        return {}
    except Exception as e:
        logger.error(f"Fallback JSON mode failed: {e}")
        return {}


# ============================================================
# Bullet rewrite (with anti-hallucination guardrails)
# ============================================================

BULLET_REWRITE_SYSTEM = """You are an expert CV writer. You rewrite CV bullet points to be more impactful, action-oriented, and credible.

CRITICAL RULES (violations = failure):
1. NEVER invent numbers, percentages, team sizes, revenue, users, or any metric
   that is not present in the original bullet. Fabrication damages the candidate.
2. If the original has no metrics, REPHRASE for clarity and impact, then ADD
   bracketed placeholders the candidate fills in:
     - "[X%]" for percentages
     - "[N users]" / "[N customers]" / "[$X revenue]" for scale
     - "[Xms -> Yms]" for performance deltas
     - "[N-person team]" for leadership scope
3. Use strong action verbs: Led, Architected, Shipped, Reduced, Owned, Scaled,
   Launched, Delivered, Drove, Built.
4. BANNED weak verbs: "worked on", "helped with", "responsible for",
   "assisted with", "participated in", "involved with".
5. Keep it to 1-2 lines maximum. No fluff. No buzzword soup. No adjectives like
   "innovative" or "robust" without substance.
6. Preserve technical accuracy. Do not change what was actually built or the
   tech stack mentioned.
7. Reply in the requested language only. Return ONLY the rewritten bullet -
   no preamble, no surrounding quotes, no "Here is the rewrite:" prefix."""


def ai_rewrite_bullet(
    bullet_text: str,
    cv_context: str,
    target_role: str | None = None,
) -> str | None:
    """
    Use GPT to rewrite a single CV bullet point to be more impactful.

    Anti-hallucination: never fabricates metrics; uses bracket placeholders the
    user can fill in.

    Returns:
        Rewritten bullet text, or None on failure.
    """
    if not is_ai_enabled():
        return None

    client = _get_client()
    if not client:
        return None

    lang = detect_language(bullet_text + " " + cv_context)
    lang_name = language_name(lang)
    role_hint = f" for a {target_role} position" if target_role else ""

    user_prompt = (
        f"Rewrite this CV bullet{role_hint}.\n\n"
        f"Original bullet: {bullet_text}\n\n"
        f"Surrounding CV context (for tone/role only - do NOT pull metrics from here):\n"
        f"{cv_context[:500]}\n\n"
        f"Reply in {lang_name}. Output the rewritten bullet ONLY."
    )

    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": BULLET_REWRITE_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.5,
            max_tokens=200,
        )
        rewritten = (response.choices[0].message.content or "").strip()
        # Strip wrapping quotes the model sometimes adds despite instructions
        if len(rewritten) >= 2 and rewritten[0] == rewritten[-1] and rewritten[0] in ("\"", "'"):
            rewritten = rewritten[1:-1].strip()
        # Strip common LLM preambles
        for prefix in ("Here is the rewrite:", "Rewritten:", "Output:"):
            if rewritten.lower().startswith(prefix.lower()):
                rewritten = rewritten[len(prefix):].strip()
        if not rewritten:
            logger.warning("Bullet rewrite produced empty output.")
            return None
        logger.info("Bullet rewrite successful")
        return rewritten
    except Exception as e:
        logger.error(f"Bullet rewrite failed: {e}")
        return None


# ============================================================
# JD Matching
# ============================================================

JD_MATCH_SYSTEM = """You are a senior technical recruiter with 15+ years of experience.
Given a candidate's CV and a job description, evaluate how well the CV matches the role.

RULES:
1. match_score is a realistic assessment (0-100). 100 = perfect fit. Be honest, not optimistic.
2. matched_keywords: list exact skills/tools/qualifications present in BOTH documents.
3. missing_keywords: list important skills/tools from the JD that are ABSENT from the CV.
4. gap_analysis: 3-6 items ordered high→medium→low priority. Each gap must:
   - Reference specific text from the JD (quote the requirement)
   - State clearly what is missing from the CV
   - Give a concrete suggestion (what the candidate can do)
5. NEVER fabricate information. Only use what is in the provided documents.
6. Write summary, descriptions, and suggestions in the SAME language as the CV.
7. Populate the structured-output schema. No prose outside the schema."""


def ai_match_cv_jd(cv_text: str, jd_text: str) -> dict:
    """
    Use GPT to match a CV against a job description.

    Returns dict with: match_score, summary, matched_keywords,
    missing_keywords, gap_analysis.
    Returns empty dict on failure.
    """
    if not is_ai_enabled():
        return {}

    client = _get_client()
    if not client:
        return {}

    lang = detect_language(cv_text)
    lang_name = language_name(lang)
    cv_preview = _smart_truncate(cv_text, max_chars=3000)
    jd_preview = jd_text[:2000]

    user_prompt = (
        f"CV LANGUAGE: {lang_name} — write summary, descriptions and suggestions in {lang_name}.\n\n"
        f"CV TEXT:\n\"\"\"\n{cv_preview}\n\"\"\"\n\n"
        f"JOB DESCRIPTION:\n\"\"\"\n{jd_preview}\n\"\"\""
    )

    try:
        response = client.beta.chat.completions.parse(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": JD_MATCH_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=1200,
            response_format=JDMatchOutput,
        )
        parsed = response.choices[0].message.parsed
        if parsed is not None:
            return parsed.model_dump()
        logger.warning("JD match: structured parse returned None, falling back.")
    except AttributeError:
        logger.warning("JD match: SDK too old for Structured Outputs, using JSON mode.")
    except Exception as e:
        logger.error(f"JD match structured call failed: {e}")

    # JSON mode fallback
    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": JD_MATCH_SYSTEM},
                {"role": "user", "content": user_prompt + "\n\nReturn ONLY valid JSON matching the schema."},
            ],
            temperature=0.3,
            max_tokens=1200,
            response_format={"type": "json_object"},
        )
        import json as _json
        return _json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"JD match JSON fallback failed: {e}")
        return {}


# ============================================================
# Cover Letter Generation
# ============================================================

COVER_LETTER_SYSTEM = """You are an expert cover letter writer for job applications.
Given a CV and a job description, write a concise, professional cover letter.

RULES:
1. 3-4 paragraphs maximum. No fluff. No generic openers like "I am writing to apply for...".
2. Paragraph 1: Hook — one strong sentence connecting the candidate's biggest strength to the role's core need.
3. Paragraph 2: 2-3 specific achievements from the CV directly relevant to the JD requirements.
4. Paragraph 3: Why this company/role specifically (use details from the JD, not generic praise).
5. Paragraph 4 (optional): One-sentence close with availability and CTA.
6. NEVER fabricate metrics, titles, or companies not present in the CV.
7. Keep total length under 300 words.
8. Return PLAIN TEXT only — no markdown, no headers, no bullet points.
9. Write in the SAME language as the CV (the target language is stated in the user message)."""


def ai_generate_cover_letter(cv_text: str, jd_text: str) -> str | None:
    """
    Generate a cover letter from a CV and job description.

    Returns plain text cover letter, or None on failure.
    """
    if not is_ai_enabled():
        return None

    client = _get_client()
    if not client:
        return None

    lang = detect_language(cv_text)
    lang_name = language_name(lang)
    cv_preview = _smart_truncate(cv_text, max_chars=3000)
    jd_preview = jd_text[:2000]

    user_prompt = (
        f"Write a cover letter in {lang_name}.\n\n"
        f"CV:\n\"\"\"\n{cv_preview}\n\"\"\"\n\n"
        f"JOB DESCRIPTION:\n\"\"\"\n{jd_preview}\n\"\"\"\n\n"
        f"Output the cover letter text ONLY. No labels, no headers."
    )

    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": COVER_LETTER_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.6,
            max_tokens=800,
        )
        text = (response.choices[0].message.content or "").strip()
        if not text:
            logger.warning("Cover letter generation produced empty output.")
            return None
        return text
    except Exception as e:
        logger.error(f"Cover letter generation failed: {e}")
        return None
