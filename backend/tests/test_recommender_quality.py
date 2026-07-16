# -*- coding: utf-8 -*-
"""Career recommender quality guards.

Founder-reported failure: a cinema/RTV graduate's CV (zero recognized
skills, one stray 'app' keyword from a commercial named 'NİĞDE APP') was
shown 'Mobile App Developer' as a career match at 4%. Guards:

1. Noise-level matches are never returned (display threshold).
2. Generic soft skills (Teamwork, Communication...) cannot carry a match
   into display range by themselves — hard skills dominate.
3. A genuinely matching candidate still scores high.
"""
from app.recommendation.recommender import CareerRecommender

JUNIOR_SWE = {
    "id": 1,
    "title": "Junior Software Engineer",
    "expected_keywords": [
        "software", "engineer", "developer", "programming", "code",
        "backend", "frontend", "full-stack", "api", "database",
    ],
    "expected_skills": [
        "Python", "JavaScript", "Java", "C++", "SQL",
        "Git", "REST API", "Unit Testing", "OOP",
        "Problem Solving", "Teamwork", "Agile",
    ],
}

MOBILE_DEV = {
    "id": 2,
    "title": "Mobile App Developer",
    "expected_keywords": [
        "mobile", "app", "android", "ios", "swift",
        "kotlin", "react native", "flutter", "store", "ui",
    ],
    "expected_skills": [
        "Swift", "Kotlin", "React Native", "Flutter", "Git",
        "REST API", "UI", "Teamwork", "Problem Solving",
    ],
}

PROFILES = [JUNIOR_SWE, MOBILE_DEV]


def test_noise_match_is_not_returned():
    """The RTV-graduate case: no skills, one accidental keyword ('app')."""
    rec = CareerRecommender(
        role_profiles=PROFILES,
        extracted_skills=[],
        keyword_matches={"Mobile App Developer": ["app"]},
    )
    assert rec.get_recommendations(top_n=3) == []


def test_soft_skills_alone_cannot_reach_display_range():
    """Generic soft skills must not carry an unrelated CV into display."""
    rec = CareerRecommender(
        role_profiles=PROFILES,
        extracted_skills=["Teamwork", "Problem Solving", "Agile"],
        keyword_matches={"Junior Software Engineer": ["software"]},
    )
    results = rec.get_recommendations(top_n=3)
    assert results == [], f"soft-skill-only profile leaked into display: {results}"


def test_real_candidate_still_scores_high():
    rec = CareerRecommender(
        role_profiles=PROFILES,
        extracted_skills=["Python", "JavaScript", "SQL", "Git", "REST API",
                          "OOP", "Unit Testing", "Teamwork"],
        keyword_matches={"Junior Software Engineer": [
            "software", "engineer", "developer", "programming", "code",
            "backend", "api", "database",
        ]},
    )
    results = rec.get_recommendations(top_n=3)
    assert results, "a genuinely matching candidate must get recommendations"
    top = results[0]
    assert top["role_id"] == 1
    assert top["score"] >= 65.0


def test_returned_results_all_meet_threshold():
    rec = CareerRecommender(
        role_profiles=PROFILES,
        extracted_skills=["Python", "SQL", "Git"],
        keyword_matches={"Junior Software Engineer": ["software", "code"],
                         "Mobile App Developer": ["app"]},
    )
    for r in rec.get_recommendations(top_n=3):
        assert r["score"] >= 30.0


# ── Evidence gate ────────────────────────────────────────────────────────────
# A CV carrying no occupational signal at all - just office tooling and soft
# skills - used to score "Human Resources Specialist" at 46.7% against the real
# seed data, higher than a genuine backend developer's second choice. The
# display threshold never caught it because generic skills piled up. A role must
# now show real evidence: discriminating hard skills, not Excel and Teamwork.

GENERIC_OFFICE_CV = [
    "Excel", "Communication", "Problem Solving", "Leadership",
    "Presentation", "Project Management", "Teamwork",
]


def test_generic_office_cv_gets_no_recommendation_against_real_seed():
    from app.seed.role_profiles_data import ROLE_PROFILES_DATA

    profiles = [dict(p, id=i) for i, p in enumerate(ROLE_PROFILES_DATA)]
    rec = CareerRecommender(
        role_profiles=profiles,
        extracted_skills=GENERIC_OFFICE_CV,
        keyword_matches={},
    )
    results = rec.get_recommendations(top_n=5)
    assert results == [], (
        "a CV with no occupational signal must not match any role; got "
        + ", ".join(f"{profiles[r['role_id']]['title']} {r['score']}%" for r in results)
    )


def test_two_discriminating_skills_are_required():
    """One hard skill is a coincidence; the gate needs corroboration."""
    one_hard = CareerRecommender(
        role_profiles=PROFILES,
        extracted_skills=["Python", "Git", "Teamwork", "Problem Solving"],
        keyword_matches={"Junior Software Engineer": [
            "software", "engineer", "developer", "programming", "code",
            "backend", "api", "database",
        ]},
    )
    assert one_hard.get_recommendations(top_n=3) == [], (
        "a single discriminating skill must not be enough evidence"
    )

    two_hard = CareerRecommender(
        role_profiles=PROFILES,
        extracted_skills=["Python", "SQL", "Git", "Teamwork", "Problem Solving"],
        keyword_matches={"Junior Software Engineer": [
            "software", "engineer", "developer", "programming", "code",
            "backend", "api", "database",
        ]},
    )
    assert two_hard.get_recommendations(top_n=3), (
        "two discriminating skills plus strong keywords must still match"
    )
