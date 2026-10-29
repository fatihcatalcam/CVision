# -*- coding: utf-8 -*-
"""/payment/pricing.md - the live prices as plain Markdown, for AI agents.

The pricing page fills its prices in from /payment/packs after it loads, so
anything that does not run JS - most AI crawlers and agents - saw packs with no
price, and llms.txt deliberately quotes none because a copied price goes stale.
This file is generated per request from the same packs and the same Lemon
prices the checkout uses, so it cannot disagree with what a buyer pays.
"""

import pytest

from app.config import settings
from app.routers import payment


@pytest.fixture
def packs(monkeypatch):
    monkeypatch.setattr(settings, "CREDIT_PACKS", "222:10,111:3")
    monkeypatch.setattr(
        payment,
        "_lemon_prices",
        lambda variants: {
            "111": {"price": 2999, "currency": "TRY"},
            "222": {"price": 7999, "currency": "TRY"},
        },
    )


def test_lists_every_pack_with_its_live_price(client, packs):
    resp = client.get("/payment/pricing.md")

    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/markdown")
    body = resp.text
    assert "| 3 | 29.99 TRY |" in body
    assert "| 10 | 79.99 TRY |" in body
    # Smallest first, as on the pricing page.
    assert body.index("| 3 |") < body.index("| 10 |")


def test_states_what_each_action_costs_and_the_free_credits(client, packs):
    body = client.get("/payment/pricing.md").text

    analysis = settings.CREDIT_ANALYSIS + settings.CREDIT_UNLOCK
    assert f"CV analysis, full report included: {analysis} credits" in body
    assert f"Job-description matching: {settings.CREDIT_MATCH} credits" in body
    assert f"AI cover letter: {settings.CREDIT_COVER_LETTER} credits" in body
    assert f"{settings.CREDIT_SIGNUP} free credits" in body
    assert "No subscription" in body


def test_a_pack_whose_price_cannot_be_read_says_so_instead_of_guessing(client, monkeypatch):
    monkeypatch.setattr(settings, "CREDIT_PACKS", "111:3")
    monkeypatch.setattr(payment, "_lemon_prices", lambda variants: {})

    body = client.get("/payment/pricing.md").text

    assert "| 3 | shown at checkout |" in body
