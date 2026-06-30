"""
Payment router - iyzico (TR) and LemonSqueezy (International) subscription integration.
Endpoints:
  POST /payment/iyzico/init              - Create iyzico Checkoutform session
  POST /payment/iyzico/callback          - iyzico payment result callback
  POST /payment/lemon/create-checkout    - Create LemonSqueezy Checkout
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
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.dependencies import get_current_user, get_db
from app.models.user import User

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
    """Set user plan to premium for 30 days."""
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.plan_type = "premium"
        user.subscription_end_at = datetime.now(timezone.utc) + timedelta(days=30)
        db.commit()
        logger.info(f"User {user_id} upgraded to premium.")


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


@router.post("/lemon/create-checkout")
def lemon_create_checkout(
    current_user: User = Depends(get_current_user),
):
    """Creates a LemonSqueezy hosted checkout and returns the URL."""
    if current_user.plan_type == "premium":
        raise HTTPException(status_code=400, detail="You already have a premium subscription.")

    if not settings.LEMONSQUEEZY_API_KEY:
        raise HTTPException(status_code=503, detail="Payment system not configured.")

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
                    "data": {"type": "variants", "id": str(settings.LEMONSQUEEZY_VARIANT_ID)}
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

    if event_name in ("subscription_created", "subscription_payment_success", "order_created"):
        if not user_id_str:
            logger.warning(f"No user_id in custom_data for event {event_name}")
            return {"received": True}
        try:
            user_id = int(user_id_str)
            sub_id = str(event.get("data", {}).get("id", ""))
            db = SessionLocal()
            try:
                if sub_id:
                    user = db.query(User).filter(User.id == user_id).first()
                    if user:
                        user.lemon_subscription_id = sub_id
                        db.commit()
                _upgrade_user(db, user_id)
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
