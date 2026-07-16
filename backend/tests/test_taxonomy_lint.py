# -*- coding: utf-8 -*-
"""Structural invariants for the role/skill taxonomy.

Pure data checks - no DB, no engine. These exist because the taxonomy rotted
silently: roles were added over time whose expected_skills were nothing but
Excel and soft skills, so four of them (Project Manager, Product Manager,
Management Consultant, HR Specialist) could not be evidenced by any CV at all,
while any CV carrying that same office filler matched them. Separately,
Structural / HVAC / Mechanical Design / Transportation Engineer all expected
the identical AutoCAD + MATLAB + Excel set and tied at 43.6% for the same CV.
And Frontend Developer expected HTML and CSS, which were not in the skills
dictionary at all, so they could never match.

None of that was caught by a test, because there was no test. The taxonomy is
about to grow substantially; these guards make writing a lazy role fail loudly
rather than quietly degrade every recommendation.
"""

import collections

from app.recommendation.recommender import _is_discriminating
from app.seed.role_profiles_data import ROLE_PROFILES_DATA
from app.seed.skills_data import SKILLS_DATA

MIN_DISCRIMINATING_SKILLS = 2

_KNOWN_SKILLS = {s["name"].lower() for s in SKILLS_DATA}


def _discriminating(profile: dict) -> list[str]:
    return [s for s in profile.get("expected_skills") or [] if _is_discriminating(s)]


def test_every_expected_skill_exists_in_the_dictionary():
    """A role cannot expect a skill the extractor has never heard of.

    Such a skill is dead weight: it can never be matched, so it only drags the
    role's denominator down. HTML and CSS sat like this for months.
    """
    ghosts = [
        (p["title"], s)
        for p in ROLE_PROFILES_DATA
        for s in p.get("expected_skills") or []
        if s.lower() not in _KNOWN_SKILLS
    ]
    assert not ghosts, "roles expect skills absent from SKILLS_DATA: " + ", ".join(
        f"{t} -> {s!r}" for t, s in ghosts
    )


def test_every_role_has_enough_discriminating_skills():
    """Soft skills and office tooling are not evidence of a profession.

    A role whose expected_skills are all generic can never clear the
    recommender's evidence gate, and worse, it matches any CV carrying the
    same filler.
    """
    thin = [
        (p["title"], _discriminating(p))
        for p in ROLE_PROFILES_DATA
        if len(_discriminating(p)) < MIN_DISCRIMINATING_SKILLS
    ]
    assert not thin, (
        f"every role needs >= {MIN_DISCRIMINATING_SKILLS} discriminating hard "
        "skills (not soft, not generic office tooling): "
        + "; ".join(f"{t} has {d or 'none'}" for t, d in thin)
    )


def test_no_two_roles_share_an_identical_skill_set():
    """Roles that expect the same things are indistinguishable to the scorer.

    Structural / HVAC / Mechanical Design / Transportation Engineer all tied at
    the same score for the same CV because of this.
    """
    by_skills: dict[frozenset, list[str]] = collections.defaultdict(list)
    for p in ROLE_PROFILES_DATA:
        by_skills[frozenset(s.lower() for s in p.get("expected_skills") or [])].append(
            p["title"]
        )

    clashes = {k: v for k, v in by_skills.items() if len(v) > 1}
    assert not clashes, "roles with identical expected_skills: " + "; ".join(
        " == ".join(titles) for titles in clashes.values()
    )


def test_role_titles_are_unique():
    """Titles are the upsert key (see seed_role_profiles).

    A duplicate would silently collapse two roles into one row.
    """
    counts = collections.Counter(p["title"] for p in ROLE_PROFILES_DATA)
    dupes = [t for t, n in counts.items() if n > 1]
    assert not dupes, f"duplicate role titles: {dupes}"


def test_skill_names_are_unique():
    counts = collections.Counter(s["name"].lower() for s in SKILLS_DATA)
    dupes = [n for n, c in counts.items() if c > 1]
    assert not dupes, f"duplicate skill names: {dupes}"


def test_every_role_declares_a_domain():
    """domain drives the AI's role filter and the suggestion wording."""
    missing = [p["title"] for p in ROLE_PROFILES_DATA if not p.get("domain")]
    assert not missing, f"roles without a domain: {missing}"


def test_known_domains_cover_every_seeded_domain():
    """A domain the AI cannot name is a domain whose roles never surface.

    The AI picks detected_domain from KNOWN_DOMAINS; role filtering then keys
    off that. A domain seeded here but absent there is dead weight - its roles
    can never be recommended to anyone.
    """
    from app.services.ai_service import KNOWN_DOMAINS

    seeded = {p["domain"] for p in ROLE_PROFILES_DATA}
    unreachable = sorted(seeded - set(KNOWN_DOMAINS))
    assert not unreachable, (
        "domains seeded but missing from ai_service.KNOWN_DOMAINS, so the AI "
        f"can never detect them: {unreachable}"
    )


def test_known_domains_are_not_invented():
    """The reverse: a domain the AI can name but nothing seeds is a dead end."""
    from app.services.ai_service import KNOWN_DOMAINS

    seeded = {p["domain"] for p in ROLE_PROFILES_DATA}
    empty = sorted(set(KNOWN_DOMAINS) - seeded)
    assert not empty, (
        "KNOWN_DOMAINS lists domains with no seeded roles; the AI would detect "
        f"them and find nothing to recommend: {empty}"
    )
