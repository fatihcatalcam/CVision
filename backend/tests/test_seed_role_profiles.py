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

    # expire_on_commit=False (conftest.py:121) means the queries below would
    # otherwise hand back identity-mapped objects unrefreshed, and the value
    # asserts would read memory instead of the rows. Force a real reload.
    db_session.expire_all()

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


def test_growing_the_seed_preserves_existing_career_recommendations(
    db_session, monkeypatch, make_user, make_cv
):
    from app.models.analysis import AnalysisResult
    from app.models.career_recommendation import CareerRecommendation

    # Build a past analysis with a career recommendation, exactly like the 50
    # real analyses in production have.
    user = make_user(email="seed-regression@test.com")
    cv = make_cv(user)
    analysis = AnalysisResult(cv_id=cv.id, overall_score=72.0)
    db_session.add(analysis)
    db_session.commit()
    db_session.refresh(analysis)

    role = db_session.query(RoleProfile).filter_by(title="Backend Developer").one()
    rec = CareerRecommendation(
        analysis_id=analysis.id,
        role_profile_id=role.id,
        match_score=65.5,
        explanation="Strong match.",
    )
    db_session.add(rec)
    db_session.commit()
    db_session.refresh(rec)
    rec_id, original_role_id = rec.id, role.id

    # Now the taxonomy grows - the exact trigger that used to wipe the table.
    monkeypatch.setattr(
        main_module, "ROLE_PROFILES_DATA", list(ROLE_PROFILES_DATA) + [NEW_ROLE]
    )
    seed_role_profiles(db_session)

    # expire_on_commit=False (conftest.py:121) means the query below would
    # otherwise hand back the identity-mapped `rec` unrefreshed, and the value
    # asserts would read memory instead of the row. Force a real reload.
    db_session.expire_all()

    # Guard against passing vacuously: the growth path must actually have run.
    assert db_session.query(RoleProfile).filter_by(title=NEW_ROLE["title"]).count() == 1

    surviving = db_session.query(CareerRecommendation).filter_by(id=rec_id).one_or_none()
    assert surviving is not None, "career recommendation was deleted by the seeder"
    assert surviving.role_profile_id == original_role_id
    assert surviving.match_score == 65.5
    # And it still resolves to the same role.
    assert surviving.role_profile.title == "Backend Developer"


def test_changed_seed_fields_are_updated_in_place(db_session, monkeypatch):
    role_before = db_session.query(RoleProfile).filter_by(
        title="Human Resources Specialist"
    ).one()
    original_id = role_before.id

    # If a later phase writes these exact skills into the seed data, the patch
    # below becomes a no-op and this test would pass vacuously. Fail loudly
    # instead so whoever lands that change fixes this test deliberately.
    assert role_before.expected_skills != ["Workday", "SuccessFactors", "Payroll"], (
        "seed data now matches the patch; pick different values for this test"
    )

    # Simulate a later phase giving this role real discriminating skills.
    # Every field the update path writes is patched, so a dropped assignment
    # during a refactor fails here instead of silently shipping. "Data &
    # Analytics" is a real domain from the taxonomy and deliberately differs
    # from this role's actual "Business & Management" - patching it to its own
    # value would never exercise the update.
    patched = []
    for data in ROLE_PROFILES_DATA:
        if data["title"] == "Human Resources Specialist":
            data = dict(
                data,
                description="Updated HR description.",
                domain="Data & Analytics",
                expected_keywords=["workday", "payroll", "recruiting"],
                expected_skills=["Workday", "SuccessFactors", "Payroll"],
            )
        patched.append(data)
    monkeypatch.setattr(main_module, "ROLE_PROFILES_DATA", patched)

    seed_role_profiles(db_session)

    # expire_on_commit=False (conftest.py:121) would otherwise hand back the
    # unrefreshed identity-mapped object and this would assert against memory.
    db_session.expire_all()

    role_after = db_session.query(RoleProfile).filter_by(
        title="Human Resources Specialist"
    ).one()
    assert role_after.id == original_id, "update must not recreate the row"
    assert role_after.expected_skills == ["Workday", "SuccessFactors", "Payroll"]
    assert role_after.expected_keywords == ["workday", "payroll", "recruiting"]
    assert role_after.description == "Updated HR description."
    assert role_after.domain == "Data & Analytics"


def test_role_dropped_from_seed_is_left_alone(db_session, monkeypatch):
    """Roles removed from the seed keep their row.

    Deleting them would cascade to the career_recommendations of past
    analyses. An orphan row is the cheaper mistake; the taxonomy only grows.
    """
    kept = [d for d in ROLE_PROFILES_DATA if d["title"] != "Accountant"]
    assert len(kept) == len(ROLE_PROFILES_DATA) - 1, "Accountant should be in the seed"
    monkeypatch.setattr(main_module, "ROLE_PROFILES_DATA", kept)

    seed_role_profiles(db_session)
    db_session.expire_all()

    survivor = db_session.query(RoleProfile).filter_by(title="Accountant").one_or_none()
    assert survivor is not None, "seeder must never delete roles"


def test_seeding_twice_changes_nothing(db_session):
    """The seeder runs on every boot; a second pass must be a no-op.

    A regression that re-inserted on each boot would only surface in prod as a
    unique-constraint crash.
    """
    def snapshot():
        # expire_on_commit=False (conftest.py:121): without this the rows come
        # back from the identity map and would look unchanged regardless.
        db_session.expire_all()
        return sorted(
            (p.id, p.title, p.domain, tuple(p.expected_skills or []))
            for p in db_session.query(RoleProfile).all()
        )

    seed_role_profiles(db_session)
    first = snapshot()

    seed_role_profiles(db_session)
    second = snapshot()

    assert first == second
    assert len(first) == len(ROLE_PROFILES_DATA)
