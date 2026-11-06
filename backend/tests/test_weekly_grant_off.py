# -*- coding: utf-8 -*-
"""The weekly grant is switched off (CREDIT_WEEKLY = 0, since 2026-11-06).

412 users and not one sale: two free reports on day one plus +2 credits every
week covered everything anyone used. The mechanism stays so it can be turned
back on; these tests hold the switch, and the promise it took off the site.
"""

from datetime import datetime, timedelta, timezone

from app.config import settings
from app.models.credit_transaction import CreditTransaction
from app.routers.payment import pricing_markdown
from app.services.credit_service import CreditService


def test_it_is_off_by_default():
    assert settings.CREDIT_WEEKLY == 0


def test_a_week_later_nothing_is_granted(make_user, db_session):
    user = make_user(email="noweekly@test.com")
    CreditService.grant(db_session, user, 1, "grant_signup")
    user.credits_granted_at = datetime.now(timezone.utc) - timedelta(days=30)
    db_session.commit()

    assert CreditService.claim_weekly_grant(db_session, user) is False

    db_session.refresh(user)
    assert user.credits == 1
    reasons = [
        r.reason
        for r in db_session.query(CreditTransaction).filter(CreditTransaction.user_id == user.id)
    ]
    assert "grant_weekly" not in reasons


def test_auth_me_adds_nothing(client, make_user, auth_headers, db_session):
    user = make_user(email="noweekly-me@test.com")
    CreditService.grant(db_session, user, 1, "grant_signup")
    user.credits_granted_at = datetime.now(timezone.utc) - timedelta(days=30)
    db_session.commit()

    assert client.get("/auth/me", headers=auth_headers(user)).json()["credits"] == 1


def test_pricing_markdown_no_longer_promises_it():
    body = pricing_markdown().body.decode()
    assert "Every week" not in body
    assert "week" not in body.lower()
