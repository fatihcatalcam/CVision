# -*- coding: utf-8 -*-
"""CreditService - every balance change, and the ledger row that explains it.

This is money code, so the properties that matter are not "does it add up" but
"can it ever be wrong": a balance must never go negative, a rejected spend must
leave nothing behind, and every row of the ledger must reconcile against the
column it is supposed to explain.

The concurrency test is the important one. The obvious implementation reads
user.credits into Python, compares, then writes - and two requests arriving
together both read the same balance and both pass the check. The service has to
push the comparison into the UPDATE itself so the database arbitrates.
"""

import pytest
from sqlalchemy import text

from app.models.credit_transaction import CreditTransaction
from app.services.credit_service import CreditService, InsufficientCredits


def _ledger(db, user):
    return (
        db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == user.id)
        .order_by(CreditTransaction.id)
        .all()
    )


# ── grant ─────────────────────────────────────────────────────────────────────

def test_grant_raises_the_balance_and_records_why(make_user, db_session):
    user = make_user(email="g@test.com")

    balance = CreditService.grant(db_session, user, 3, "grant_signup")

    assert balance == 3
    assert user.credits == 3
    rows = _ledger(db_session, user)
    assert len(rows) == 1
    assert (rows[0].delta, rows[0].balance_after, rows[0].reason) == (3, 3, "grant_signup")


def test_grants_accumulate(make_user, db_session):
    user = make_user(email="acc@test.com")

    CreditService.grant(db_session, user, 3, "grant_signup")
    balance = CreditService.grant(db_session, user, 2, "grant_weekly")

    assert balance == 5
    assert [r.balance_after for r in _ledger(db_session, user)] == [3, 5]


# ── spend ─────────────────────────────────────────────────────────────────────

def test_spend_lowers_the_balance_and_records_what_for(make_user, db_session):
    user = make_user(email="s@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")

    balance = CreditService.spend(db_session, user, 1, "spend_analysis", ref_id="cv_9")

    assert balance == 2
    assert user.credits == 2
    last = _ledger(db_session, user)[-1]
    assert (last.delta, last.balance_after, last.ref_id) == (-1, 2, "cv_9")


def test_spending_the_whole_balance_is_allowed(make_user, db_session):
    user = make_user(email="exact@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")

    assert CreditService.spend(db_session, user, 3, "spend_unlock") == 0


def test_spending_more_than_the_balance_is_refused(make_user, db_session):
    user = make_user(email="over@test.com")
    CreditService.grant(db_session, user, 2, "grant_signup")

    with pytest.raises(InsufficientCredits):
        CreditService.spend(db_session, user, 3, "spend_unlock")


def test_a_refused_spend_leaves_nothing_behind(make_user, db_session):
    """No balance change and no ledger row - a rejection is not an event."""
    user = make_user(email="clean@test.com")
    CreditService.grant(db_session, user, 2, "grant_signup")
    before = len(_ledger(db_session, user))

    with pytest.raises(InsufficientCredits):
        CreditService.spend(db_session, user, 5, "spend_unlock")

    db_session.expire_all()
    assert db_session.get(type(user), user.id).credits == 2
    assert len(_ledger(db_session, user)) == before


def test_spending_from_an_empty_balance_is_refused(make_user, db_session):
    user = make_user(email="zero@test.com")

    with pytest.raises(InsufficientCredits):
        CreditService.spend(db_session, user, 1, "spend_analysis")


# ── the race ──────────────────────────────────────────────────────────────────

def test_a_stale_in_memory_balance_cannot_overdraw(make_user, db_session):
    """The double-spend: two requests read the same balance, both pass their
    check, both write.

    Reproduced deterministically by moving the balance underneath a loaded
    object. After the raw UPDATE the database holds 0 while `user.credits` still
    says 1 - exactly the state the second request is in when the first one has
    committed but its own object was loaded earlier.

    An implementation that compares `user.credits` in Python reads 1, allows the
    spend and lands on -1. One that puts the comparison in the UPDATE's WHERE
    clause matches no row and refuses. Note the object is NOT refreshed here on
    purpose - db_session.get() would return this same identity-mapped instance,
    so re-reading through the session could not produce a stale value at all.
    """
    user = make_user(email="race@test.com")
    CreditService.grant(db_session, user, 1, "grant_signup")

    db_session.execute(
        text("UPDATE users SET credits = 0 WHERE id = :uid"), {"uid": user.id}
    )
    assert user.credits == 1, "the in-memory object must still be stale"

    with pytest.raises(InsufficientCredits):
        CreditService.spend(db_session, user, 1, "spend_analysis")

    db_session.expire_all()
    assert db_session.get(type(user), user.id).credits == 0


# ── input guards ──────────────────────────────────────────────────────────────

@pytest.mark.parametrize("amount", [0, -1])
def test_spend_rejects_non_positive_amounts(make_user, db_session, amount):
    """A zero spend is a no-op that would still write a ledger row, and a
    negative one is a grant wearing a spend's label."""
    user = make_user(email="guard@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")

    with pytest.raises(ValueError):
        CreditService.spend(db_session, user, amount, "spend_analysis")


@pytest.mark.parametrize("amount", [0, -1])
def test_grant_rejects_non_positive_amounts(make_user, db_session, amount):
    user = make_user(email="guard2@test.com")

    with pytest.raises(ValueError):
        CreditService.grant(db_session, user, amount, "grant_weekly")


# ── reconciliation ────────────────────────────────────────────────────────────

def test_the_ledger_reconciles_against_the_balance(make_user, db_session):
    """The invariant the whole design rests on: sum(delta) == users.credits, and
    every balance_after matches the running total at that point."""
    user = make_user(email="recon@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")
    CreditService.spend(db_session, user, 1, "spend_analysis")
    CreditService.grant(db_session, user, 2, "grant_weekly")
    CreditService.spend(db_session, user, 2, "spend_unlock")

    rows = _ledger(db_session, user)
    running = 0
    for row in rows:
        running += row.delta
        assert row.balance_after == running

    db_session.expire_all()
    assert db_session.get(type(user), user.id).credits == running == 2
