# -*- coding: utf-8 -*-
"""The HQ overview reports credits, not plan conversion.

"Pro conversion" was premium_users / total_users - a ratio of a plan that stops
deciding anything once features are priced in credits, so it reads 0% forever
whatever happens. These three replace it.

Spend is read off the ledger rather than off balances on purpose: a balance only
shows what is left, so a user granted 3 credits who spent all 3 is
indistinguishable from one who never came back.
"""

import pytest

from app.services.credit_service import CreditService


@pytest.fixture
def overview(client, auth_headers):
    def _get(admin):
        resp = client.get("/hq-portal/overview", headers=auth_headers(admin))
        assert resp.status_code == 200
        return resp.json()

    return _get


def test_circulation_is_the_sum_of_every_balance(
    make_user, db_session, overview
):
    admin = make_user(email="hqcredits@test.com", role="admin")
    a = make_user(email="holder1@test.com")
    b = make_user(email="holder2@test.com")
    CreditService.grant(db_session, a, 5, "grant_signup")
    CreditService.grant(db_session, b, 7, "grant_signup")

    # The admin was created without a balance, so the two holders are the total.
    assert overview(admin)["credits_in_circulation"] == 12


def test_spend_is_counted_even_after_the_balance_is_gone(
    make_user, db_session, overview
):
    """The case a balance-only metric misses entirely."""
    admin = make_user(email="hqspend@test.com", role="admin")
    user = make_user(email="spender@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")
    CreditService.spend(db_session, user, 3, "spend_analysis_pro")

    data = overview(admin)

    assert data["credits_in_circulation"] == 0
    assert data["credits_spent_this_week"] == 3


def test_refunds_do_not_count_as_spend(make_user, db_session, overview):
    """A failed analysis is charged and given back. Counting the charge without
    the refund would inflate usage with work nobody received."""
    admin = make_user(email="hqrefund@test.com", role="admin")
    user = make_user(email="refunded@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")
    CreditService.spend(db_session, user, 1, "spend_analysis")
    CreditService.refund(db_session, user, 1, "refund_failed_analysis")

    data = overview(admin)

    assert data["credits_in_circulation"] == 3
    # The spend still happened, so it is still counted; the refund restored the
    # balance. Both numbers are true and they say different things.
    assert data["credits_spent_this_week"] == 1


def test_paying_users_counts_people_not_orders(make_user, db_session, overview):
    admin = make_user(email="hqpaying@test.com", role="admin")
    buyer = make_user(email="buyer@test.com")
    make_user(email="freeloader@test.com")

    CreditService.grant(db_session, buyer, 10, "purchase", ref_id="ls_order_1")
    CreditService.grant(db_session, buyer, 30, "purchase", ref_id="ls_order_2")

    assert overview(admin)["paying_users"] == 1


def test_grants_are_not_spend(make_user, db_session, overview):
    admin = make_user(email="hqgrant@test.com", role="admin")
    user = make_user(email="granted@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")

    assert overview(admin)["credits_spent_this_week"] == 0
