# -*- coding: utf-8 -*-
"""An email/password account cannot sign in until its address is confirmed.

Fake signups were collecting the free credits with made-up and throwaway
addresses. So an email signup now gets a 6-digit code by mail, cannot log in
until the code is entered, and only gets its opening credits when it does.
Google sign-in is untouched - Google has already verified the address - and
every account that existed before this counts as verified.
"""

from datetime import datetime, timedelta

import pytest

from app.config import settings
from app.models.user import User
from app.services import email_service

PASSWORD = "Passw0rd!"


@pytest.fixture
def outbox(monkeypatch):
    """Every mail the app tries to send, instead of sending it."""
    sent: list[dict] = []
    monkeypatch.setattr(settings, "RESEND_API_KEY", "test-key")
    monkeypatch.setattr(email_service.resend.Emails, "send", lambda payload: sent.append(payload))
    return sent


def _register(client, email="new@test.com", password=PASSWORD, **extra):
    return client.post(
        "/auth/register",
        json={"full_name": "Deniz Yılmaz", "email": email, "password": password, "language": "tr", **extra},
    )


def _user(db_session, email="new@test.com") -> User:
    db_session.expire_all()
    return db_session.query(User).filter(User.email == email).one()


# ── Signup ────────────────────────────────────────────────────────────────────

def test_signup_creates_an_unverified_account_and_mails_a_code(client, db_session, outbox):
    resp = _register(client)

    assert resp.status_code == 201
    user = _user(db_session)
    assert user.email_verified_at is None
    assert user.verify_code and len(user.verify_code) == 6 and user.verify_code.isdigit()
    assert len(outbox) == 1
    assert user.verify_code in outbox[0]["html"]


def test_signup_does_not_grant_credits_or_send_the_welcome_yet(client, db_session, outbox):
    _register(client)

    user = _user(db_session)
    assert user.credits == 0
    assert all("hoş geldin" not in m["subject"].lower() for m in outbox)


def test_unverified_account_cannot_log_in(client, outbox):
    _register(client)

    resp = client.post("/auth/login", json={"email": "new@test.com", "password": PASSWORD})

    assert resp.status_code == 403
    assert resp.json()["message"] == "email_not_verified"


def test_wrong_password_on_an_unverified_account_still_says_wrong_password(client, outbox):
    # Otherwise the 403 would confirm the address is registered to anyone guessing.
    _register(client)

    resp = client.post("/auth/login", json={"email": "new@test.com", "password": "Wrong0pass"})

    assert resp.status_code == 401


def test_disposable_address_is_refused(client, db_session, outbox):
    resp = _register(client, email="someone@mailinator.com")

    assert resp.status_code == 400
    assert resp.json()["message"] == "disposable_email"
    assert db_session.query(User).filter(User.email == "someone@mailinator.com").count() == 0
    assert outbox == []


def test_subdomain_of_a_disposable_domain_is_refused(client, outbox):
    resp = _register(client, email="someone@x.mailinator.com")

    assert resp.status_code == 400
    assert resp.json()["message"] == "disposable_email"


def test_signing_up_again_on_an_unverified_address_replaces_it(client, db_session, outbox):
    # Someone else signing up with your address and never confirming must not
    # lock you out of it - and must not keep the password they chose.
    _register(client, password="Squatt3rPass")
    user = _user(db_session)
    first_code = user.verify_code
    user.verify_code_sent_at = datetime.utcnow() - timedelta(minutes=2)
    db_session.commit()

    resp = _register(client, password="R3alOwnerPass")

    assert resp.status_code == 201
    assert db_session.query(User).filter(User.email == "new@test.com").count() == 1
    user = _user(db_session)
    assert user.verify_code != first_code
    verified = client.post("/auth/verify-email", json={"email": "new@test.com", "code": user.verify_code})
    assert verified.status_code == 200
    assert client.post("/auth/login", json={"email": "new@test.com", "password": "R3alOwnerPass"}).status_code == 200
    assert client.post("/auth/login", json={"email": "new@test.com", "password": "Squatt3rPass"}).status_code == 401


def test_signing_up_again_within_a_minute_does_not_mail_again(client, db_session, outbox):
    # Otherwise repeated signups would get around the resend cooldown and
    # could be used to flood somebody's inbox.
    _register(client)
    code = _user(db_session).verify_code

    assert _register(client).status_code == 201

    assert len(outbox) == 1
    assert _user(db_session).verify_code == code


def test_signing_up_on_a_verified_address_is_still_a_conflict(client, make_user, outbox):
    make_user(email="taken@test.com")

    assert _register(client, email="taken@test.com").status_code == 409


# ── Verifying ─────────────────────────────────────────────────────────────────

def test_the_right_code_verifies_signs_in_and_opens_the_account(client, db_session, outbox):
    _register(client)
    code = _user(db_session).verify_code

    resp = client.post("/auth/verify-email", json={"email": "new@test.com", "code": code})

    assert resp.status_code == 200
    assert resp.json()["access_token"]
    user = _user(db_session)
    assert user.email_verified_at is not None
    assert user.verify_code is None
    assert user.credits == settings.CREDIT_SIGNUP
    assert any("CVision'a hoş geldin" in m["subject"] for m in outbox)
    assert client.post("/auth/login", json={"email": "new@test.com", "password": PASSWORD}).status_code == 200


def test_a_wrong_code_is_refused_and_counted(client, db_session, outbox):
    _register(client)
    wrong = "000000" if _user(db_session).verify_code != "000000" else "111111"

    resp = client.post("/auth/verify-email", json={"email": "new@test.com", "code": wrong})

    assert resp.status_code == 400
    assert resp.json()["message"] == "invalid_code"
    assert _user(db_session).verify_code_attempts == 1


def test_five_wrong_codes_lock_the_code(client, db_session, outbox):
    _register(client)
    code = _user(db_session).verify_code
    wrong = "000000" if code != "000000" else "111111"
    for _ in range(5):
        client.post("/auth/verify-email", json={"email": "new@test.com", "code": wrong})

    resp = client.post("/auth/verify-email", json={"email": "new@test.com", "code": code})

    assert resp.status_code == 429
    assert resp.json()["message"] == "too_many_attempts"


def test_an_expired_code_is_refused(client, db_session, outbox):
    _register(client)
    user = _user(db_session)
    user.verify_code_expires_at = datetime.utcnow() - timedelta(minutes=1)
    db_session.commit()

    resp = client.post("/auth/verify-email", json={"email": "new@test.com", "code": user.verify_code})

    assert resp.status_code == 400
    assert resp.json()["message"] == "code_expired"


def test_verifying_twice_does_not_grant_credits_twice(client, db_session, outbox):
    _register(client)
    code = _user(db_session).verify_code
    client.post("/auth/verify-email", json={"email": "new@test.com", "code": code})

    again = client.post("/auth/verify-email", json={"email": "new@test.com", "code": code})

    assert again.status_code == 400
    assert _user(db_session).credits == settings.CREDIT_SIGNUP


# ── Resending ─────────────────────────────────────────────────────────────────

def test_resend_replaces_the_code(client, db_session, outbox):
    _register(client)
    user = _user(db_session)
    # Past the resend cooldown.
    user.verify_code_sent_at = datetime.utcnow() - timedelta(minutes=2)
    db_session.commit()

    resp = client.post("/auth/resend-verification", json={"email": "new@test.com"})

    assert resp.status_code == 200
    user = _user(db_session)
    assert len(outbox) == 2
    assert user.verify_code in outbox[1]["html"]
    # A fresh code also comes with fresh attempts and a fresh expiry.
    assert user.verify_code_attempts == 0
    assert user.verify_code_expires_at > datetime.utcnow()


def test_resend_within_a_minute_does_not_mail_again(client, outbox):
    _register(client)

    resp = client.post("/auth/resend-verification", json={"email": "new@test.com"})

    assert resp.status_code == 200
    assert len(outbox) == 1


def test_resend_says_the_same_thing_for_unknown_and_verified_addresses(client, make_user, outbox):
    make_user(email="old@test.com")

    unknown = client.post("/auth/resend-verification", json={"email": "nobody@test.com"})
    verified = client.post("/auth/resend-verification", json={"email": "old@test.com"})

    assert unknown.status_code == verified.status_code == 200
    assert unknown.json() == verified.json()
    assert outbox == []


# ── Other ways of proving the address ─────────────────────────────────────────

def test_password_reset_proves_the_address(client, db_session, outbox):
    _register(client)
    client.post("/auth/forgot-password", json={"email": "new@test.com"})
    code = _user(db_session).reset_code

    resp = client.post(
        "/auth/reset-password",
        json={"email": "new@test.com", "code": code, "new_password": "N3wPassword"},
    )

    assert resp.status_code == 200
    user = _user(db_session)
    assert user.email_verified_at is not None
    assert user.credits == settings.CREDIT_SIGNUP
    assert client.post("/auth/login", json={"email": "new@test.com", "password": "N3wPassword"}).status_code == 200


def test_google_sign_in_takes_over_an_unverified_email_account(client, db_session, outbox, monkeypatch):
    _register(client)
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "test-client")

    class _Resp:
        status_code = 200

        @staticmethod
        def json():
            return {"email": "new@test.com", "sub": "google-123", "email_verified": True, "name": "Deniz"}

    import requests

    monkeypatch.setattr(requests, "get", lambda *a, **k: _Resp())

    resp = client.post("/auth/google", json={"access_token": "x" * 30})

    assert resp.status_code == 200
    assert resp.json()["access_token"]
    user = _user(db_session)
    assert user.google_id == "google-123"
    assert user.email_verified_at is not None
    # Whoever typed the password at signup never proved they own the address.
    assert user.password_hash is None
    assert user.credits == settings.CREDIT_SIGNUP


def test_existing_accounts_count_as_verified(client, make_user):
    make_user(email="old@test.com")

    resp = client.post("/auth/login", json={"email": "old@test.com", "password": PASSWORD})

    assert resp.status_code == 200
