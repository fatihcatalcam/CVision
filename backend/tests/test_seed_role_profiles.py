# -*- coding: utf-8 -*-
"""Seeder regression tests for seed_role_profiles.

Guards the 2026-07 upsert conversion. The old implementation deleted every
role_profile row (and every career_recommendation hanging off it) as soon as
the seed list grew, which would have wiped the career recommendations of all
past analyses. Roles must keep their ids, so rows are never deleted and
recreated.
"""

import app.main as main_module
from app.main import seed_role_profiles
from app.models.role_profile import RoleProfile
from app.seed.role_profiles_data import ROLE_PROFILES_DATA

# A role that does not exist in the real seed data, used to simulate the
# taxonomy growing (Phase C) without depending on the real list's contents.
NEW_ROLE = {
    "title": "Test Video Editor",
    "description": "Cuts and assembles video footage.",
    "domain": "Media & Creative",
    "expected_keywords": ["video", "editing", "post-production"],
    "expected_skills": ["Adobe Premiere", "DaVinci Resolve", "After Effects"],
}


def _titles_to_ids(db) -> dict[str, int]:
    return {p.title: p.id for p in db.query(RoleProfile).all()}


def test_growing_the_seed_adds_the_role_and_keeps_existing_ids(
    db_session, monkeypatch
):
    before = _titles_to_ids(db_session)
    assert before, "reference seed should have populated role_profiles"

    monkeypatch.setattr(
        main_module, "ROLE_PROFILES_DATA", list(ROLE_PROFILES_DATA) + [NEW_ROLE]
    )

    seed_role_profiles(db_session)

    after = _titles_to_ids(db_session)

    # The new role landed.
    assert NEW_ROLE["title"] in after

    # domain drives career matching (c8c1b67) - a silent fallback to the
    # "Software Engineering" default must not pass this test.
    inserted = db_session.query(RoleProfile).filter_by(title=NEW_ROLE["title"]).one()
    assert inserted.domain == "Media & Creative"
    assert inserted.expected_skills == NEW_ROLE["expected_skills"]
    assert inserted.expected_keywords == NEW_ROLE["expected_keywords"]

    # Every pre-existing role kept its exact id. This is the whole point: the
    # career_recommendations FK points at these ids.
    for title, role_id in before.items():
        assert title in after, f"seeder deleted {title!r}"
        assert after[title] == role_id, f"id of {title!r} changed: {role_id} -> {after[title]}"
