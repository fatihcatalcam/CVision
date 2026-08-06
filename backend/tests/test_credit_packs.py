# -*- coding: utf-8 -*-
"""Buying credits: which packs exist, and getting paid for them exactly once.

The money lives in Lemon Squeezy - a variant carries its own price - so this
side only maps a paid order back to what it bought. Two things have to hold.

A checkout may only be opened for a variant we know the credit value of.
Otherwise a crafted request could open a checkout against any product in the
store, and the webhook would take the money with nothing to grant for it.

And the webhook has to be idempotent. Lemon retries delivery on our timeout, on
a 500, and on a manual replay from their dashboard - a second delivery must not
hand out a second pack. The ledger is the deduplication key, which is another
reason it had to exist before money did.
"""

import hashlib
import hmac
import json
import uuid

import pytest

from app.auth.hashing import hash_password
from app.config import settings
from app.database import SessionLocal
from app.models.credit_transaction import CreditTransaction
from app.models.user import User


PACKS = "1001:10,1002:30,1003:75"


@pytest.fixture
def packs_on_sale(monkeypatch):
    monkeypatch.setattr(settings, "CREDIT_PACKS", PACKS)
    monkeypatch.setattr(settings, "LEMONSQUEEZY_API_KEY", "test-key")
    monkeypatch.setattr(settings, "LEMONSQUEEZY_WEBHOOK_SECRET", "test-secret")


def _signed(body: dict) -> tuple[bytes, dict]:
    raw = json.dumps(body).encode()
    sig = hmac.new(b"test-secret", raw, hashlib.sha256).hexdigest()
    return raw, {"X-Signature": sig, "Content-Type": "application/json"}


def _order(user_id: int, variant_id: str, order_id: str) -> dict:
    return {
        "meta": {"event_name": "order_created", "custom_data": {"user_id": str(user_id)}},
        "data": {
            "id": order_id,
            "attributes": {"first_order_item": {"variant_id": variant_id}},
        },
    }


@pytest.fixture
def real_user():
    """A user committed outside the test transaction, cleaned up afterwards.

    The webhook opens its own SessionLocal - it is called by Lemon, not by a
    request we control - so a user living only inside the per-test SAVEPOINT is
    invisible to it. Same reason test_image_pdf_handling commits for real.
    """
    created: list[int] = []

    def _make() -> int:
        db = SessionLocal()
        try:
            user = User(
                full_name="Pack Buyer", email=f"{uuid.uuid4().hex[:12]}@packs.test",
                password_hash=hash_password("Passw0rd!"), role="user", plan_type="free",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            created.append(user.id)
            return user.id
        finally:
            db.close()

    yield _make

    db = SessionLocal()
    try:
        for uid in created:
            db.query(CreditTransaction).filter(CreditTransaction.user_id == uid).delete()
            db.query(User).filter(User.id == uid).delete()
        db.commit()
    finally:
        db.close()


def _balance(user_id: int) -> int:
    db = SessionLocal()
    try:
        return db.query(User).filter(User.id == user_id).one().credits
    finally:
        db.close()


def _purchases(user_id: int) -> list:
    db = SessionLocal()
    try:
        return (
            db.query(CreditTransaction)
            .filter(CreditTransaction.user_id == user_id,
                    CreditTransaction.reason == "purchase")
            .all()
        )
    finally:
        db.close()


def _ledger(db, user_id):
    return (
        db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == user_id)
        .order_by(CreditTransaction.id)
        .all()
    )


# ── what is on sale ───────────────────────────────────────────────────────────

def test_packs_are_listed_smallest_first(client, packs_on_sale):
    resp = client.get("/payment/packs")

    assert resp.status_code == 200
    assert [p["credits"] for p in resp.json()["packs"]] == [10, 30, 75]


def test_malformed_pack_entries_are_skipped_not_fatal(monkeypatch):
    """A typo in an env var must not take the app down at import time."""
    monkeypatch.setattr(settings, "CREDIT_PACKS", "1:10,broken,2:abc,:9,3:0,4:20")

    assert settings.credit_packs == {"1": 10, "4": 20}


def test_no_packs_configured_means_none_on_sale(client, monkeypatch):
    monkeypatch.setattr(settings, "CREDIT_PACKS", "")

    assert client.get("/payment/packs").json()["packs"] == []


# ── opening a checkout ────────────────────────────────────────────────────────

def test_an_unknown_variant_is_refused(client, make_user, auth_headers, packs_on_sale):
    """The guard that stops a crafted request opening a checkout for any product
    in the store - which the webhook could then not attribute to any pack."""
    user = make_user(email="pack@test.com")

    resp = client.post(
        "/payment/lemon/create-checkout",
        json={"variant_id": "9999"},
        headers=auth_headers(user),
    )

    assert resp.status_code == 400


def test_checkout_is_refused_when_nothing_is_on_sale(
    client, make_user, auth_headers, monkeypatch
):
    monkeypatch.setattr(settings, "LEMONSQUEEZY_API_KEY", "test-key")
    monkeypatch.setattr(settings, "CREDIT_PACKS", "")
    user = make_user(email="pack2@test.com")

    resp = client.post(
        "/payment/lemon/create-checkout",
        json={"variant_id": "1001"},
        headers=auth_headers(user),
    )

    assert resp.status_code == 503


# ── getting paid ──────────────────────────────────────────────────────────────

def test_a_paid_order_grants_the_pack(client, real_user, packs_on_sale):
    user_id = real_user()

    raw, headers = _signed(_order(user_id, "1002", "ord_1"))
    resp = client.post("/payment/lemon/webhook", content=raw, headers=headers)

    assert resp.status_code == 200
    assert _balance(user_id) == 30
    rows = _purchases(user_id)
    assert len(rows) == 1
    assert rows[0].ref_id == "ls_order_ord_1"


def test_a_replayed_webhook_does_not_pay_twice(client, real_user, packs_on_sale):
    """Lemon retries on our timeout, on a 500, and on a manual replay."""
    user_id = real_user()
    raw, headers = _signed(_order(user_id, "1003", "ord_2"))

    for _ in range(3):
        client.post("/payment/lemon/webhook", content=raw, headers=headers)

    assert _balance(user_id) == 75
    assert len(_purchases(user_id)) == 1


def test_two_separate_orders_both_pay(client, real_user, packs_on_sale):
    """Deduplication is per order, not per user - a second purchase is real."""
    user_id = real_user()

    for order_id in ("ord_3", "ord_4"):
        raw, headers = _signed(_order(user_id, "1001", order_id))
        client.post("/payment/lemon/webhook", content=raw, headers=headers)

    assert _balance(user_id) == 20


def test_an_order_for_an_unknown_variant_grants_nothing(
    client, real_user, packs_on_sale
):
    """Money we cannot attribute to a pack. Granting a guess would be either
    theft or a giveaway, so it grants nothing and logs loudly instead."""
    user_id = real_user()

    raw, headers = _signed(_order(user_id, "8888", "ord_5"))
    resp = client.post("/payment/lemon/webhook", content=raw, headers=headers)

    assert resp.status_code == 200
    assert _balance(user_id) == 0


def test_an_order_with_no_id_grants_nothing(client, real_user, packs_on_sale):
    """The order id is the deduplication key. Without one, every such payload
    collapses onto the same key - so the first would grant and every real order
    after it would be silently skipped as a duplicate. Refusing is recoverable
    by hand through the admin adjustment; a silent skip is not even visible.
    """
    user_id = real_user()

    raw, headers = _signed(_order(user_id, "1001", ""))
    resp = client.post("/payment/lemon/webhook", content=raw, headers=headers)

    assert resp.status_code == 200
    assert _balance(user_id) == 0
    assert _purchases(user_id) == []


def test_a_forged_signature_is_rejected(client, real_user, packs_on_sale):
    user_id = real_user()
    raw = json.dumps(_order(user_id, "1003", "ord_6")).encode()

    resp = client.post(
        "/payment/lemon/webhook",
        content=raw,
        headers={"X-Signature": "deadbeef", "Content-Type": "application/json"},
    )

    assert resp.status_code == 400
    assert _balance(user_id) == 0
