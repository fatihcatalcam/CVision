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
