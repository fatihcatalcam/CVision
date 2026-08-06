# -*- coding: utf-8 -*-
"""Admin credit adjustments go through the ledger like everything else.

Support work is where a balance most often moves by hand - goodwill after a bad
run, a botched charge, a promised top-up. It is also the change most likely to be
questioned later, so it is the last place that should be allowed to write the
column directly and leave no trace.
"""

import pytest

from app.models.credit_transaction import CreditTransaction
from app.models.user import User
from app.services.credit_service import CreditService


def _ledger(db, user_id):
    return (
        db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == user_id)
        .order_by(CreditTransaction.id)
        .all()
    )


def test_an_admin_can_hand_out_credits(client, make_user, auth_headers, db_session):
    admin = make_user(email="ca@test.com", role="admin")
    target = make_user(email="ct@test.com")

    resp = client.patch(
        f"/hq-portal/users/{target.id}/credits?delta=10", headers=auth_headers(admin)
    )

    assert resp.status_code == 200
    assert resp.json()["credits"] == 10
    assert _ledger(db_session, target.id)[-1].reason == "grant_admin"


def test_an_admin_can_claw_credits_back(client, make_user, auth_headers, db_session):
    admin = make_user(email="ca2@test.com", role="admin")
    target = make_user(email="ct2@test.com")
    CreditService.grant(db_session, target, 10, "purchase")

    resp = client.patch(
        f"/hq-portal/users/{target.id}/credits?delta=-4", headers=auth_headers(admin)
    )

    assert resp.status_code == 200
    assert resp.json()["credits"] == 6
    assert _ledger(db_session, target.id)[-1].reason == "spend_admin"


def test_an_adjustment_cannot_push_a_balance_negative(
    client, make_user, auth_headers, db_session
):
    admin = make_user(email="ca3@test.com", role="admin")
    target = make_user(email="ct3@test.com")
    CreditService.grant(db_session, target, 2, "grant_signup")

    resp = client.patch(
        f"/hq-portal/users/{target.id}/credits?delta=-5", headers=auth_headers(admin)
    )

    assert resp.status_code == 400
    db_session.expire_all()
    assert db_session.get(User, target.id).credits == 2


def test_a_zero_adjustment_is_refused(client, make_user, auth_headers):
    admin = make_user(email="ca4@test.com", role="admin")
    target = make_user(email="ct4@test.com")

    resp = client.patch(
        f"/hq-portal/users/{target.id}/credits?delta=0", headers=auth_headers(admin)
    )

    assert resp.status_code == 400


def test_a_normal_user_cannot_adjust_anyone(client, make_user, auth_headers):
    intruder = make_user(email="ci@test.com")
    target = make_user(email="ct5@test.com")

    resp = client.patch(
        f"/hq-portal/users/{target.id}/credits?delta=100", headers=auth_headers(intruder)
    )

    assert resp.status_code == 403


def test_the_ledger_is_readable_newest_first(client, make_user, auth_headers, db_session):
    admin = make_user(email="ca6@test.com", role="admin")
    target = make_user(email="ct6@test.com")
    CreditService.grant(db_session, target, 3, "grant_signup")
    CreditService.spend(db_session, target, 1, "spend_analysis", ref_id="cv_1")
    db_session.commit()

    resp = client.get(
        f"/hq-portal/users/{target.id}/credits", headers=auth_headers(admin)
    )

    assert resp.status_code == 200
    rows = resp.json()
    assert [r["reason"] for r in rows] == ["spend_analysis", "grant_signup"]
    assert rows[0]["balance_after"] == 2
    assert rows[0]["ref_id"] == "cv_1"
