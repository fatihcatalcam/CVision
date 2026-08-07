"""
Payment router - credit-pack purchases via LemonSqueezy, plus the legacy
iyzico subscription flow.
Endpoints:
  POST /payment/iyzico/init              - Create iyzico Checkoutform session
  POST /payment/iyzico/callback          - iyzico payment result callback
  GET  /payment/packs                    - Credit packs on sale
  POST /payment/lemon/create-checkout    - Checkout for one credit pack
  POST /payment/lemon/webhook            - LemonSqueezy webhook handler
  POST /payment/lemon/cancel             - Cancel LemonSqueezy subscription
  GET  /payment/status                   - Current user subscription status
"""

import hashlib
import hmac
import json
import logging
import time
from datetime import datetime, timezone, timedelta

import httpx
import iyzipay
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.services.credit_service import CreditService

logger = logging.getLogger("cvision.payment")

router = APIRouter(prefix="/payment", tags=["Payment"])

# ─────────────────────────────── helpers ──────────────────────────────────────

def _iyzico_options() -> dict:
    # http.client.HTTPSConnection expects hostname without scheme
    base_url = settings.IYZICO_BASE_URL
    for prefix in ("https://", "http://"):
        if base_url.startswith(prefix):
            base_url = base_url[len(prefix):]
            break
    return {
        "api_key": settings.IYZICO_API_KEY,
        "secret_key": settings.IYZICO_SECRET_KEY,
        "base_url": base_url,
    }


def _upgrade_user(db: Session, user_id: int) -> None:
    """Set user plan to premium for 30 days and hand over the credits it buys.

    The credits are the part that matters now. plan_type stopped gating anything
    when the credit system landed - features are priced, not tiered - so a
    purchase that only set the flag would take the money and deliver nothing.
    The flag is still set because the badge, the admin counts and the cancel flow
    read it.

    CREDIT_PREMIUM_PURCHASE is deliberately generous while the real pricing is
    still being worked out: with no paying users yet, over-delivering to the
    first few costs nothing, and under-delivering to someone who paid is not
    recoverable.
    """
    from app.services.credit_service import CreditService

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.plan_type = "premium"
        user.subscription_end_at = datetime.now(timezone.utc) + timedelta(days=30)
        db.commit()
        CreditService.grant(
            db, user, settings.CREDIT_PREMIUM_PURCHASE, "purchase", ref_id="premium_30d"
        )
        db.commit()
        logger.info(
            f"User {user_id} upgraded to premium and granted "
            f"{settings.CREDIT_PREMIUM_PURCHASE} credits."
        )


def _redirect_html(url: str) -> HTMLResponse:
    """Return an HTML page that immediately redirects the browser."""
    return HTMLResponse(
        content=f'<html><head><meta http-equiv="refresh" content="0; url={url}"></head>'
                f'<body><p>Yönlendiriliyor... <a href="{url}">Tıklayın</a></p></body></html>',
        status_code=200,
    )


# ─────────────────────────────── iyzico ───────────────────────────────────────

@router.post("/iyzico/init")
def iyzico_init(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Creates an iyzico Checkoutform session and returns the hosted payment page URL.
    Frontend redirects the user to paymentPageUrl.
    """
    if current_user.plan_type == "premium":
        raise HTTPException(status_code=400, detail="Zaten premium üyeliğiniz var.")

    client_ip = (request.client.host if request.client else "85.34.78.112") or "85.34.78.112"
    conversation_id = f"cvision_{current_user.id}_{int(time.time())}"

    name_parts = current_user.full_name.strip().split()
    first_name = name_parts[0]
    last_name = name_parts[-1] if len(name_parts) > 1 else name_parts[0]

    reg_date = (
        current_user.created_at.strftime("%Y-%m-%d %H:%M:%S")
        if current_user.created_at
        else "2025-01-01 00:00:00"
    )

    iyzico_request = {
        "locale": "tr",
        "conversationId": conversation_id,
        "price": "149.99",
        "paidPrice": "149.99",
        "currency": "TRY",
        "basketId": f"basket_{current_user.id}",
        "paymentGroup": "SUBSCRIPTION",
        "callbackUrl": f"{settings.BACKEND_URL}/payment/iyzico/callback",
        "enabledInstallments": ["1", "2", "3"],
        "buyer": {
            "id": str(current_user.id),
            "name": first_name,
            "surname": last_name,
            "gsmNumber": "+905350000000",
            "email": current_user.email,
            "identityNumber": "11111111111",
            "lastLoginDate": reg_date,
            "registrationDate": reg_date,
            "registrationAddress": "Türkiye",
            "ip": client_ip,
            "city": "Istanbul",
            "country": "Turkey",
            "zipCode": "34000",
        },
        "shippingAddress": {
            "contactName": current_user.full_name,
            "city": "Istanbul",
            "country": "Turkey",
            "address": "Türkiye",
            "zipCode": "34000",
        },
        "billingAddress": {
            "contactName": current_user.full_name,
            "city": "Istanbul",
            "country": "Turkey",
            "address": "Türkiye",
            "zipCode": "34000",
        },
        "basketItems": [
            {
                "id": "cvision_pro_monthly",
                "name": "CVision Pro Aylık Üyelik",
                "category1": "Yazılım",
                "category2": "SaaS",
                "itemType": "VIRTUAL",
                "price": "149.99",
            }
        ],
    }

    try:
        response = iyzipay.CheckoutFormInitialize().create(iyzico_request, _iyzico_options())
        result = json.loads(response.read().decode("utf-8"))
    except Exception as e:
        logger.error(f"iyzico init error: {e}")
        raise HTTPException(status_code=502, detail="Ödeme sistemi başlatılamadı.")

    if result.get("status") != "success":
        error_msg = result.get("errorMessage", "iyzico başlatma hatası")
        logger.warning(f"iyzico init failed: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)

    return {
        "paymentPageUrl": result["paymentPageUrl"],
        "token": result.get("token"),
    }


@router.post("/iyzico/callback", response_class=HTMLResponse)
async def iyzico_callback(request: Request):
    """
    iyzico posts back here after payment. Verifies the result and upgrades the user.
    Returns an HTML redirect to the frontend success or cancel page.
    """
    try:
        form = await request.form()
        token = form.get("token")
    except Exception:
        return _redirect_html(f"{settings.FRONTEND_URL}/payment/cancel")

    if not token:
        return _redirect_html(f"{settings.FRONTEND_URL}/payment/cancel")

    try:
        response = iyzipay.CheckoutForm().retrieve(
            {"locale": "tr", "token": token}, _iyzico_options()
        )
        result = json.loads(response.read().decode("utf-8"))
    except Exception as e:
        logger.error(f"iyzico callback verify error: {e}")
        return _redirect_html(f"{settings.FRONTEND_URL}/payment/cancel")

    if result.get("paymentStatus") != "SUCCESS":
        logger.warning(f"iyzico payment not SUCCESS: {result.get('paymentStatus')}")
        return _redirect_html(f"{settings.FRONTEND_URL}/payment/cancel")

    conversation_id = result.get("conversationId", "")
    parts = conversation_id.split("_")
    # Format: cvision_{user_id}_{timestamp}
    if len(parts) < 3:
        logger.error(f"Unexpected conversationId format: {conversation_id}")
        return _redirect_html(f"{settings.FRONTEND_URL}/payment/cancel")

    try:
        user_id = int(parts[1])
    except (ValueError, IndexError):
        return _redirect_html(f"{settings.FRONTEND_URL}/payment/cancel")

    db = SessionLocal()
    try:
        _upgrade_user(db, user_id)
    finally:
        db.close()

    return _redirect_html(f"{settings.FRONTEND_URL}/payment/success")


# ─────────────────────────────── LemonSqueezy ─────────────────────────────────

_LEMON_API_BASE = "https://api.lemonsqueezy.com/v1"


def _lemon_headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.LEMONSQUEEZY_API_KEY}",
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
    }


class CheckoutRequest(BaseModel):
    variant_id: str


# Prices fetched from Lemon Squeezy, with the moment they were fetched. Lemon
# is the only place a price is authoritative, but asking it on every page load
# would put a third-party outage in the way of our own pricing page.
_price_cache: dict[str, dict] = {}
_price_cache_at: datetime | None = None
_PRICE_TTL = timedelta(minutes=10)


def _lemon_prices(variant_ids: list[str]) -> dict[str, dict]:
    """{variant_id: {"price": <minor units>, "currency": "TRY"}} for what we can read.

    Deliberately partial and deliberately silent: a variant we cannot price is
    left out and the page renders it without one. Showing no price is a smaller
    problem than showing a number the checkout then contradicts, and a Lemon
    outage must not take our own pricing page down with it.
    """
    global _price_cache_at

    now = datetime.now(timezone.utc)
    if _price_cache_at and now - _price_cache_at < _PRICE_TTL:
        return _price_cache

    if not settings.LEMONSQUEEZY_API_KEY:
        return {}

    prices: dict[str, dict] = {}
    headers = {
        "Authorization": f"Bearer {settings.LEMONSQUEEZY_API_KEY}",
        "Accept": "application/vnd.api+json",
    }

    try:
        with httpx.Client(timeout=10) as client:
            for variant_id in variant_ids:
                resp = client.get(f"{_LEMON_API_BASE}/variants/{variant_id}", headers=headers)
                if resp.status_code != 200:
                    logger.warning(
                        "Lemon variant %s returned %s while pricing", variant_id, resp.status_code
                    )
                    continue

                attrs = (resp.json().get("data") or {}).get("attributes") or {}
                amount = attrs.get("price")
                if not isinstance(amount, int) or amount <= 0:
                    # Newer Lemon products keep the amount on a separate price
                    # record. Nothing to show rather than something invented.
                    logger.info("Lemon variant %s exposes no price attribute", variant_id)
                    continue

                prices[str(variant_id)] = {
                    "price": amount,
                    "currency": attrs.get("currency") or "USD",
                }
    except httpx.HTTPError as exc:
        logger.warning("Could not reach Lemon Squeezy for prices: %s", exc)
        return _price_cache  # last known good, even if stale

    _price_cache.clear()
    _price_cache.update(prices)
    _price_cache_at = now
    return prices


@router.get("/packs", summary="Credit packs available for purchase")
def list_credit_packs():
    """What is on sale, smallest first, with the price where we can read it.

    The price comes from Lemon rather than from our own config so there is only
    one number: a second copy in an env var is a copy that can disagree with the
    checkout, and the checkout is the one that takes the money.
    """
    packs = settings.credit_packs
    ordered = sorted(packs.items(), key=lambda kv: kv[1])
    prices = _lemon_prices([variant for variant, _ in ordered])

    return {
        "packs": [
            {
                "variant_id": variant,
                "credits": credits,
                # None when Lemon could not be read; the card renders priceless.
                "price": prices.get(variant, {}).get("price"),
                "currency": prices.get(variant, {}).get("currency"),
            }
            for variant, credits in ordered
        ]
    }


@router.post("/lemon/create-checkout")
def lemon_create_checkout(
    body: CheckoutRequest,
    current_user: User = Depends(get_current_user),
):
    """Creates a LemonSqueezy hosted checkout for a credit pack."""
    if not settings.LEMONSQUEEZY_API_KEY:
        raise HTTPException(status_code=503, detail="Payment system not configured.")

    packs = settings.credit_packs
    if not packs:
        raise HTTPException(status_code=503, detail="Credit packs are not on sale yet.")

    # Only variants we know the credit value of. Otherwise a crafted request
    # could open a checkout for any product in the store, and the webhook would
    # then take the money with nothing to grant for it.
    if body.variant_id not in packs:
        raise HTTPException(status_code=400, detail="Unknown credit pack.")

    payload = {
        "data": {
            "type": "checkouts",
            "attributes": {
                "checkout_data": {
                    "email": current_user.email,
                    "name": current_user.full_name,
                    "custom": {"user_id": str(current_user.id)},
                },
                "product_options": {
                    "redirect_url": f"{settings.FRONTEND_URL}/payment/success",
                },
            },
            "relationships": {
                "store": {
                    "data": {"type": "stores", "id": str(settings.LEMONSQUEEZY_STORE_ID)}
                },
                "variant": {
                    "data": {"type": "variants", "id": body.variant_id}
                },
            },
        }
    }

    try:
        with httpx.Client(timeout=30) as client:
            resp = client.post(
                f"{_LEMON_API_BASE}/checkouts",
                json=payload,
                headers=_lemon_headers(),
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"LemonSqueezy checkout error: {e.response.text}")
        raise HTTPException(status_code=502, detail="Payment session creation failed.")
    except Exception as e:
        logger.error(f"LemonSqueezy error: {e}")
        raise HTTPException(status_code=502, detail="Payment system error.")

    return {"checkoutUrl": data["data"]["attributes"]["url"]}


@router.post("/lemon/webhook")
async def lemon_webhook(request: Request):
    """LemonSqueezy posts signed events here. Upgrades user on successful payment."""
    payload = await request.body()
    signature = request.headers.get("X-Signature", "")

    if not settings.LEMONSQUEEZY_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook not configured.")

    expected = hmac.new(
        settings.LEMONSQUEEZY_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        logger.warning("LemonSqueezy webhook signature mismatch")
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        event = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_name = event.get("meta", {}).get("event_name", "")
    custom_data = event.get("meta", {}).get("custom_data") or {}
    user_id_str = custom_data.get("user_id") if isinstance(custom_data, dict) else None

    if event_name == "order_created":
        if not user_id_str:
            logger.warning(f"No user_id in custom_data for event {event_name}")
            return {"received": True}

        data = event.get("data", {}) or {}
        attrs = data.get("attributes", {}) or {}
        item = attrs.get("first_order_item", {}) or {}
        variant_id = str(item.get("variant_id", ""))
        order_id = str(data.get("id", ""))

        if not order_id:
            # Without an order id there is no deduplication key, and every such
            # payload would collapse onto the same one - so the FIRST malformed
            # order would grant, and every real one after it would be silently
            # skipped as a duplicate. Refusing is recoverable by hand; a silent
            # skip is not even visible.
            logger.error("order_created with no order id; granting nothing: %s", attrs)
            return {"received": True}

        credits = settings.credit_packs.get(variant_id)
        if credits is None:
            # Money we cannot attribute to a pack. Log loudly and grant nothing
            # rather than guess - a wrong guess is either theft or a giveaway.
            logger.error(
                "Paid order %s is for unknown variant %s; no credits granted",
                order_id, variant_id,
            )
            return {"received": True}

        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            logger.error(f"Invalid user_id in LemonSqueezy webhook: {user_id_str}")
            return {"received": True}

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user is None:
                logger.error("Paid order %s names unknown user %s", order_id, user_id)
                return {"received": True}

            # Keyed on the Lemon order id: this endpoint is retried by design,
            # and a second delivery must not hand out a second pack.
            granted = CreditService.grant_once(
                db, user, credits, "purchase", ref_id=f"ls_order_{order_id}"
            )
            db.commit()
            if granted:
                logger.info(
                    "Order %s granted %d credits to user %s", order_id, credits, user_id
                )
        finally:
            db.close()

    elif event_name in ("subscription_cancelled", "subscription_expired"):
        if not user_id_str:
            logger.warning(f"No user_id in custom_data for event {event_name}")
            return {"received": True}
        try:
            user_id = int(user_id_str)
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    user.plan_type = "free"
                    user.subscription_end_at = None
                    user.lemon_subscription_id = None
                    db.commit()
                    logger.info(f"User {user_id} downgraded via {event_name}.")
            finally:
                db.close()
        except (ValueError, TypeError):
            logger.error(f"Invalid user_id in LemonSqueezy webhook: {user_id_str}")

    return {"received": True}


@router.post("/lemon/cancel")
def lemon_cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancels the active LemonSqueezy subscription at period end."""
    if current_user.plan_type != "premium":
        raise HTTPException(status_code=400, detail="No active subscription to cancel.")

    if not current_user.lemon_subscription_id:
        user = db.query(User).filter(User.id == current_user.id).first()
        user.plan_type = "free"
        user.subscription_end_at = None
        db.commit()
        return {"status": "cancelled", "message": "Subscription cancelled."}

    if not settings.LEMONSQUEEZY_API_KEY:
        raise HTTPException(status_code=503, detail="Payment system not configured.")

    try:
        with httpx.Client(timeout=30) as client:
            resp = client.patch(
                f"{_LEMON_API_BASE}/subscriptions/{current_user.lemon_subscription_id}",
                json={
                    "data": {
                        "type": "subscriptions",
                        "id": str(current_user.lemon_subscription_id),
                        "attributes": {"cancelled": True},
                    }
                },
                headers=_lemon_headers(),
            )
            resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        logger.error(f"LemonSqueezy cancel error: {e.response.text}")
        raise HTTPException(status_code=502, detail="Failed to cancel subscription.")
    except Exception as e:
        logger.error(f"LemonSqueezy cancel error: {e}")
        raise HTTPException(status_code=502, detail="Cancellation failed.")

    return {
        "status": "cancel_at_period_end",
        "message": "Your subscription will not renew. Pro access continues until the end of the billing period.",
        "subscription_end_at": current_user.subscription_end_at.isoformat() if current_user.subscription_end_at else None,
    }


# ─────────────────────────────── Status ───────────────────────────────────────

@router.get("/status")
def payment_status(current_user: User = Depends(get_current_user)):
    """Returns the current user's subscription status."""
    return {
        "plan_type": current_user.plan_type,
        "subscription_end_at": current_user.subscription_end_at,
    }
