"""
AI graceful-degradation tests for app.services.ai_service.

The product promise is that CVision stays fully functional when OpenAI is
disabled, misconfigured, or flaky — analysis falls back to rule-based output and
nothing 500s. These tests pin every fallback contract:

  Disabled / no client (the autouse _no_real_openai guard returns None):
    - is_ai_enabled() is False (empty key in the test env)
    - ai_enhance_analysis  → {}
    - ai_match_cv_jd       → {}
    - ai_generate_cover_letter → None
    - ai_rewrite_bullet    → None

  Enabled with a fake client (mock_openai_client):
    - happy path: Structured Outputs parsed object → dict
    - structured call raises → JSON-mode fallback succeeds → dict
    - JSON-mode returns invalid JSON → {} (still no crash)

The fake client never touches the network; it is a MagicMock whose call sites we
configure with SimpleNamespace response shapes mirroring the OpenAI SDK.
"""

from types import SimpleNamespace

from app.services import ai_service
from app.services.ai_service import (
    CVAnalysis,
    ai_enhance_analysis,
    ai_generate_cover_letter,
    ai_match_cv_jd,
    ai_rewrite_bullet,
    is_ai_enabled,
)

CV_TEXT = "Software engineer with experience building scalable backend APIs."


# ── Disabled / no-client fallbacks ───────────────────────────────────────────

def test_is_ai_disabled_without_key():
    # conftest sets OPENAI_API_KEY="" in the env before app import.
    assert is_ai_enabled() is False


def test_enhance_returns_empty_when_disabled():
    result = ai_enhance_analysis(CV_TEXT, rule_based_suggestions=[], scores={})
    assert result == {}


def test_match_returns_empty_when_disabled():
    assert ai_match_cv_jd(CV_TEXT, "Job description text") == {}


def test_cover_letter_returns_none_when_disabled():
    assert ai_generate_cover_letter(CV_TEXT, "Job description text") is None


def test_rewrite_bullet_returns_none_when_disabled():
    assert ai_rewrite_bullet("Worked on the API", CV_TEXT) is None


# ── Enabled-with-fake-client paths ───────────────────────────────────────────

def _wrap_parsed(parsed):
    """Shape a beta.chat.completions.parse(...) return value."""
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(parsed=parsed))]
    )


def _wrap_content(content):
    """Shape a chat.completions.create(...) return value."""
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=content))]
    )


def test_enhance_happy_path_structured(mock_openai_client):
    parsed = CVAnalysis(
        executive_summary="Strong backend engineer.",
        strengths=["a", "b", "c"],
        weaknesses=["d", "e", "f"],
        ai_suggestions=[],
    )
    mock_openai_client.beta.chat.completions.parse.return_value = _wrap_parsed(parsed)

    result = ai_enhance_analysis(CV_TEXT, rule_based_suggestions=[], scores={})

    assert result["executive_summary"] == "Strong backend engineer."
    assert result["strengths"] == ["a", "b", "c"]


def test_enhance_falls_back_to_json_mode(mock_openai_client):
    # Structured Outputs path blows up → code must drop to JSON mode.
    mock_openai_client.beta.chat.completions.parse.side_effect = Exception("structured boom")
    mock_openai_client.chat.completions.create.return_value = _wrap_content(
        '{"executive_summary": "From JSON fallback",'
        ' "strengths": [], "weaknesses": [], "ai_suggestions": []}'
    )

    result = ai_enhance_analysis(CV_TEXT, rule_based_suggestions=[], scores={})

    assert result["executive_summary"] == "From JSON fallback"


def test_enhance_invalid_json_returns_empty(mock_openai_client):
    mock_openai_client.beta.chat.completions.parse.side_effect = Exception("structured boom")
    mock_openai_client.chat.completions.create.return_value = _wrap_content(
        "this is not valid json at all"
    )

    result = ai_enhance_analysis(CV_TEXT, rule_based_suggestions=[], scores={})

    # Bad JSON must degrade to {} (caller uses rule-based output), never raise.
    assert result == {}
