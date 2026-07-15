# -*- coding: utf-8 -*-
"""Anti-gaming regression tests for the scoring engine.

A CV that stuffs its skills/keywords sections to game the score must not
out-rank a focused, genuinely-qualified CV. Guards the relevance-weighted
skills score + keyword denominator hardening (2026-07 anti-gaming overhaul).

DB-free: the engine takes plain skill/profile dicts.
"""

from app.analysis.engine import AnalysisEngine
from app.seed.skills_data import SKILLS_DATA
from app.seed.role_profiles_data import ROLE_PROFILES_DATA


def _engine() -> AnalysisEngine:
    skills = [
        {"id": i, "name": s["name"], "category": s["category"]}
        for i, s in enumerate(SKILLS_DATA)
    ]
    profiles = [
        p for p in ROLE_PROFILES_DATA if p.get("domain") == "Software Engineering"
    ]
    return AnalysisEngine(skills, profiles)


# A focused senior backend engineer: real experience, a tight set of skills
# that are all relevant to the Software Engineering target.
CV_SENIOR = """
John Smith
Email: john.smith@example.com | Phone: +1 555 123 4567

PROFESSIONAL SUMMARY
Senior software engineer with 6 years of experience building backend systems.

WORK EXPERIENCE
Senior Backend Developer | Acme Corp | Jan 2021 - Present
- Developed and maintained REST API microservices in Python and Node.js
- Led a team of 4 engineers; managed sprint planning in Agile

Software Engineer | Beta Ltd | 2019 - 2021
- Built frontend features with React and TypeScript

EDUCATION
BSc Computer Science, Bogazici University, 2015 - 2019

SKILLS
Python, JavaScript, TypeScript, C++, C#, SQL, React, Node.js, Docker, Git

PROJECTS
Open-source task queue library in Go
"""

# Software-engineering keywords the profile expects, stuffed to max keyword score.
_SW_KEYWORDS = (
    "software engineer developer programming code backend frontend full-stack "
    "api database testing version control debug deploy algorithms data structures "
    "object-oriented agile rest microservices"
)

# The SKILLS section is manufacturing / BI / office skills that exist in the DB
# but are NOT relevant to a Software Engineering role. A relevance-aware score
# must not reward these the way it rewards real software skills.
_IRRELEVANT_SKILLS = (
    "ERP Systems, SAP, Lean Manufacturing, Production Planning, "
    "Supply Chain Management, Lean Six Sigma, Process Optimization, Kaizen, "
    "Time Study, Value Stream Mapping, Inventory Optimization, Logistics, "
    "Tableau, Power BI, Excel, Figma, Hadoop, Apache Spark, Presentation, "
    "Time Management"
)

CV_GAMED_IRRELEVANT = f"""
Ivy Rrelevant
Email: ivy@example.com | Phone: +1 555 111 2222

PROFESSIONAL SUMMARY
{_SW_KEYWORDS} {_SW_KEYWORDS}

WORK EXPERIENCE
Consultant | Self | 2020 - Present
- {_SW_KEYWORDS}

EDUCATION
BSc, Some University, 2016 - 2020

SKILLS
{_IRRELEVANT_SKILLS}

PROJECTS
Projects delivered using {_IRRELEVANT_SKILLS}

LANGUAGES
English
"""


def test_irrelevant_skill_stuffing_scores_below_focused_senior():
    """A CV targeting Software Engineering whose skills are all off-target
    (SAP, Kaizen, Excel...) must land clearly below a focused senior, even
    though it stuffs every expected keyword."""
    engine = _engine()
    senior = engine.run(CV_SENIOR)
    gamed = engine.run(CV_GAMED_IRRELEVANT)

    assert gamed.overall_score <= senior.overall_score - 8.0, (
        f"gamed={gamed.overall_score} must trail senior={senior.overall_score} "
        f"by >=8 pts (skills relevance not applied?)"
    )


def test_irrelevant_skills_do_not_max_the_skills_subscore():
    """Off-target skills must not saturate the skills sub-score at 100."""
    gamed = _engine().run(CV_GAMED_IRRELEVANT)
    assert gamed.skills_score <= 60.0, (
        f"skills_score={gamed.skills_score} — off-target skills should not "
        f"approach the max"
    )


def test_focused_senior_keeps_a_high_skills_subscore():
    """The relevance change must not punish a legitimately strong CV."""
    senior = _engine().run(CV_SENIOR)
    assert senior.skills_score >= 80.0, (
        f"skills_score={senior.skills_score} — a focused senior with 10+ "
        f"relevant skills should stay high"
    )
