# -*- coding: utf-8 -*-
"""Schema and defaults behind the credit system.

Balance lives on users.credits, but credit_transactions is the record of how it
got there - the two are meant to agree, and every later step writes both. These
tests pin the shape that guarantee rests on: a new account starts at zero credits
until something grants them, a report is locked until it is paid for, and the
ledger accepts both directions with a running balance.

The migration itself (d2e3f4a5b6c7) hands existing rows an opening balance. That
part is not exercised here because the test database is built from the models via
create_all, never from Alembic - see the note in tests/conftest.py. The rules the
migration encodes are asserted in test_credit_service once the service exists.
"""

from app.models.analysis import AnalysisResult
from app.models.credit_transaction import CreditTransaction


def test_new_user_starts_with_no_credits(make_user):
    """Zero, not three. The signup grant is a ledger event, not a column
    default - otherwise the balance would exist with nothing explaining it."""
    user = make_user(email="fresh@test.com")

    assert user.credits == 0
    assert user.credits_granted_at is None


def test_credits_survive_a_round_trip(make_user, db_session):
    user = make_user(email="bal@test.com")
    user.credits = 7
    db_session.commit()
    db_session.expire_all()

    assert db_session.get(type(user), user.id).credits == 7


def test_a_new_analysis_is_locked(make_user, make_cv, db_session):
    owner = make_user(email="lock@test.com")
    cv = make_cv(owner)
    analysis = AnalysisResult(cv_id=cv.id, overall_score=70.0, ats_score=70.0,
                              keyword_score=70.0, completeness_score=70.0,
                              experience_score=70.0)
    db_session.add(analysis)
    db_session.commit()
    db_session.expire_all()

    assert db_session.get(AnalysisResult, analysis.id).is_unlocked is False


def test_the_ledger_records_both_directions(make_user, db_session):
    user = make_user(email="ledger@test.com")
    rows = [
        CreditTransaction(user_id=user.id, delta=3, balance_after=3, reason="grant_signup"),
        CreditTransaction(user_id=user.id, delta=-1, balance_after=2,
                          reason="spend_analysis", ref_id="cv_42"),
        CreditTransaction(user_id=user.id, delta=-2, balance_after=0, reason="spend_unlock"),
    ]
    db_session.add_all(rows)
    db_session.commit()

    stored = (
        db_session.query(CreditTransaction)
        .filter(CreditTransaction.user_id == user.id)
        .order_by(CreditTransaction.id)
        .all()
    )

    assert [r.delta for r in stored] == [3, -1, -2]
    # balance_after must track the running sum - that is the whole point of
    # denormalizing it, and a mismatch here is how a lost write gets caught.
    running = 0
    for row in stored:
        running += row.delta
        assert row.balance_after == running
    assert stored[1].ref_id == "cv_42"


def test_deleting_a_user_takes_their_ledger_with_them(make_user, db_session):
    """GDPR-shaped: an account deletion cannot leave orphan rows behind that
    still name the user id."""
    user = make_user(email="gone@test.com")
    user_id = user.id
    db_session.add(CreditTransaction(user_id=user_id, delta=3, balance_after=3,
                                     reason="grant_signup"))
    db_session.commit()

    db_session.delete(user)
    db_session.commit()

    remaining = (
        db_session.query(CreditTransaction)
        .filter(CreditTransaction.user_id == user_id)
        .count()
    )
    assert remaining == 0


def test_migration_chain_stays_linear():
    """The credit migration extends the chain rather than forking it - Alembic
    refuses to upgrade a history with two heads, and the backend hard-crashes on
    a failed migration rather than booting degraded."""
    from alembic.config import Config
    from alembic.script import ScriptDirectory

    script = ScriptDirectory.from_config(Config("alembic.ini"))

    heads = script.get_heads()
    assert len(heads) == 1, f"migration history forked: {heads}"

    credit = script.get_revision("d2e3f4a5b6c7")
    assert credit.down_revision == "c1d2e3f4a5b6"
