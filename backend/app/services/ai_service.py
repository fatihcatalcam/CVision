"""
AI Service — wraps OpenAI GPT API to enhance CV analysis results.

Provides:
- AI-powered CV summary and executive narrative
- Smart, personalized suggestion generation
- "Fix My CV" rewrite for individual bullet points
- Language-aware (Turkish/English CV detection & bilingual hints)

Falls back gracefully if API key is missing or call fails.
"""

import json
import logging
from typing import Any

from app.config import settings

logger = logging.getLogger("cvision.services.ai")


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


def detect_language(text: str) -> str:
    """
    Heuristically detect if CV is primarily Turkish or English.
    Returns 'tr' or 'en'.
    """
    turkish_keywords = [
        "deneyim", "eğitim", "beceriler", "hakkımda", "iletişim",
        "üniversite", "mezuniyet", "staj", "bölüm", "lisans",
        "yüksek lisans", "özet", "projeler", "sertifika", "referanslar",
        "amaç", "hedef", "çalışma", "görev", "sorumluluk"
    ]
    text_lower = text.lower()
    tr_count = sum(1 for kw in turkish_keywords if kw in text_lower)
    return "tr" if tr_count >= 3 else "en"


def ai_enhance_analysis(
    cv_text: str,
    rule_based_suggestions: list[dict],
    scores: dict,
    target_domain: str | None = None,
    role_profiles: list[dict] | None = None,
) -> dict[str, Any]:
    """
    Use GPT-4o-mini to produce AI-enhanced analysis output.
    
    Args:
        cv_text: Raw extracted text from the CV.
        rule_based_suggestions: Suggestions from the deterministic engine.
        scores: Dict with overall_score, ats_score, etc.
        target_domain: User's selected target domain.
        role_profiles: Top matching role profiles with their expected keywords.
    
    Returns:
        Dict with keys: summary, strengths, weaknesses, ai_suggestions
        Returns empty dict on failure (caller falls back to rule-based output).
    """
    if not is_ai_enabled():
        logger.info("AI service disabled — using rule-based output only.")
        return {}

    client = _get_client()
    if not client:
        return {}

    lang = detect_language(cv_text)
    
    # Truncate CV text to avoid hitting token limits (~800 words is enough for analysis)
    cv_preview = cv_text[:3000] if len(cv_text) > 3000 else cv_text
    
    # Build context about existing scores
    score_context = (
        f"Overall: {scores.get('overall_score', 0):.0f}%, "
        f"ATS: {scores.get('ats_score', 0):.0f}%, "
        f"Keyword Match: {scores.get('keyword_score', 0):.0f}%, "
        f"Completeness: {scores.get('completeness_score', 0):.0f}%, "
        f"Experience: {scores.get('experience_score', 0):.0f}%"
    )
    
    # Build role context
    role_context = ""
    if target_domain:
        if target_domain.lower() == "other":
            role_context = "Target Domain: [Unknown/Other]. IMPORTANT: Please deduce the candidate's primary profession from the CV and evaluate them as an expert recruiter in that deduced profession."
        else:
            role_context = f"Target Domain: {target_domain}"
    if role_profiles and target_domain and target_domain.lower() != "other":
        top_roles = [p.get("title", "") for p in role_profiles[:3]]
        role_context += f"\nBest Matching Roles: {', '.join(top_roles)}"
    
    # Build prompt
    system_prompt = """You are a senior career consultant and CV expert with 15+ years of experience 
helping candidates land jobs at top companies. You give brutally honest but constructive feedback.
You understand both Turkish and English CVs deeply. You always respond in valid JSON only."""

    user_prompt = f"""Analyze this CV and the scoring data below. Return a JSON object with these exact fields.

CV TEXT:
\"\"\"
{cv_preview}
\"\"\"

SCORING DATA:
{score_context}
{role_context}
CV Language Detected: {"Turkish" if lang == "tr" else "English"}

EXISTING RULE-BASED ISSUES FOUND:
{json.dumps([s.get("message", "") for s in rule_based_suggestions[:5]], ensure_ascii=False)}

Return ONLY a valid JSON object with these exact keys:
{{
  "executive_summary": "A 2-3 sentence honest executive summary about this CV's overall quality, written in {("Turkish" if lang == "tr" else "English")}. Be specific about what's good and what needs work.",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "ai_suggestions": [
    {{
      "category": "experience|skills|content|formatting|ats",
      "priority": "high|medium|low",
      "message": "Specific, actionable suggestion (NO generic advice). Reference actual content from the CV where possible.",
      "rewrite_hint": "If applicable: show a before→after example directly quoting CV content. If not applicable, use empty string."
    }}
  ]
}}

Rules:
- Generate 4-6 ai_suggestions
- Each message must be SPECIFIC to THIS CV's content, not generic advice
- rewrite_hint should show: 'Before: [quote from CV] → After: [improved version]' where possible
- Strengths/weaknesses: 3 items each, specific to this CV
- Write summary and suggestions in {("Turkish" if lang == "tr" else "English")}
- Return ONLY the JSON, no markdown, no extra text"""

    try:
        logger.info(f"Calling OpenAI API (model: {settings.OPENAI_MODEL}, lang: {lang})")
        
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.4,  # Lower = more consistent, professional
            max_tokens=1500,
            response_format={"type": "json_object"},  # Forces valid JSON output
        )
        
        raw_content = response.choices[0].message.content
        result = json.loads(raw_content)
        
        logger.info(
            f"AI enhancement successful — "
            f"{len(result.get('ai_suggestions', []))} suggestions generated"
        )
        
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"AI returned invalid JSON: {e}")
        return {}
    except Exception as e:
        logger.error(f"OpenAI API call failed: {e}")
        return {}


def ai_rewrite_bullet(
    bullet_text: str,
    cv_context: str,
    target_role: str | None = None,
) -> str | None:
    """
    Use GPT to rewrite a single CV bullet point to be more impactful.
    
    Args:
        bullet_text: The original bullet point text from the CV.
        cv_context: Brief context about the CV (role/domain).
        target_role: Optional target job role for tailoring.
    
    Returns:
        Rewritten bullet text, or None on failure.
    """
    if not is_ai_enabled():
        return None
    
    client = _get_client()
    if not client:
        return None
    
    lang = detect_language(bullet_text + " " + cv_context)
    
    role_hint = f" targeting a {target_role} position" if target_role else ""
    
    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert CV writer. Rewrite CV bullet points to be "
                        "more impactful, quantified, and action-oriented. "
                        "Keep the same meaning but make it sound professional and impressive. "
                        f"Reply in {'Turkish' if lang == 'tr' else 'English'} only."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Rewrite this CV bullet point{role_hint} to be more impactful. "
                        f"Add quantification if possible (numbers, percentages, scale). "
                        f"Keep it to 1-2 lines max.\n\n"
                        f"Original: {bullet_text}\n\n"
                        f"Return ONLY the rewritten text, nothing else."
                    ),
                },
            ],
            temperature=0.5,
            max_tokens=200,
        )
        
        rewritten = response.choices[0].message.content.strip()
        logger.info(f"Bullet rewrite successful")
        return rewritten
        
    except Exception as e:
        logger.error(f"Bullet rewrite failed: {e}")
        return None
