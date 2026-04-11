"""
Payment router — iyzico (TR) and Stripe (International) subscription integration.
Endpoints:
  POST /payment/iyzico/init          — Create iyzico Checkoutform session
  POST /payment/iyzico/callback      — iyzico payment result callback
  POST /payment/stripe/create-session — Create Stripe Checkout Session
  POST /payment/stripe/webhook       — Stripe webhook handler
  GET  /payment/status               — Current user subscription status
"""

import json
import logging
import time
from datetime import datetime, timezone, timedelta

import stripe
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


# ─────────────────────────────── Stripe ───────────────────────────────────────

@router.post("/stripe/create-session")
def stripe_create_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a Stripe Checkout Session for a $4.99/month subscription.
    Returns the hosted checkout URL for frontend redirect.
    """
    if current_user.plan_type == "premium":
        raise HTTPException(status_code=400, detail="You already have a premium subscription.")

    stripe.api_key = settings.STRIPE_SECRET_KEY
    if not stripe.api_key or stripe.api_key.startswith("sk_test_your"):
        raise HTTPException(status_code=503, detail="Stripe is not configured.")

    # Ensure Stripe customer exists
    customer_id = current_user.stripe_customer_id
    if not customer_id:
        try:
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.full_name,
                metadata={"user_id": str(current_user.id)},
            )
            user = db.query(User).filter(User.id == current_user.id).first()
            user.stripe_customer_id = customer.id
            db.commit()
            customer_id = customer.id
        except stripe.StripeError as e:
            logger.error(f"Stripe customer create error: {e}")
            raise HTTPException(status_code=502, detail="Stripe customer creation failed.")

    try:
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": "CVision Pro",
                            "description": "50 CV analyses/week + all premium AI features",
                        },
                        "unit_amount": 499,  # $4.99 in cents
                        "recurring": {"interval": "month"},
                    },
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=(
                f"{settings.FRONTEND_URL}/payment/success"
                "?session_id={CHECKOUT_SESSION_ID}"
            ),
            cancel_url=f"{settings.FRONTEND_URL}/payment/cancel",
            metadata={"user_id": str(current_user.id)},
        )
    except stripe.StripeError as e:
        logger.error(f"Stripe session create error: {e}")
        raise HTTPException(status_code=502, detail="Stripe session creation failed.")

    return {"checkoutUrl": session.url}


@router.post("/stripe/verify-session")
def stripe_verify_session(
    request_body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Verifies a completed Stripe Checkout Session by session_id and upgrades user.
    Called from the frontend success page as a reliable fallback to webhooks.
    """
    session_id = request_body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    stripe.api_key = settings.STRIPE_SECRET_KEY
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except stripe.StripeError as e:
        logger.error(f"Stripe session retrieve error: {e}")
        raise HTTPException(status_code=502, detail="Could not verify session.")

    if session.get("payment_status") != "paid":
        raise HTTPException(status_code=400, detail="Payment not completed.")

    # Ensure the session belongs to the current user
    metadata = session.get("metadata") or {}
    session_user_id = metadata.get("user_id")
    if str(current_user.id) != str(session_user_id):
        raise HTTPException(status_code=403, detail="Session does not belong to this user.")

    _upgrade_user(db, current_user.id)
    logger.info(f"User {current_user.id} upgraded via session verify.")
    return {"status": "ok", "plan_type": "premium"}


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    """
    Stripe sends webhook events here. Verifies signature and upgrades user on payment success.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Stripe webhook invalid payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except Exception as e:
        logger.error(f"Stripe webhook signature error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        event_type = event["type"] if isinstance(event, dict) else event.type
        event_data = event["data"]["object"] if isinstance(event, dict) else event.data.object

        if isinstance(event_data, dict):
            metadata = event_data.get("metadata") or {}
            user_id_str = metadata.get("user_id")
            sub_id = event_data.get("subscription")
        else:
            metadata = getattr(event_data, "metadata", None) or {}
            user_id_str = metadata.get("user_id") if isinstance(metadata, dict) else getattr(metadata, "user_id", None)
            sub_id = getattr(event_data, "subscription", None)

        if event_type in ("checkout.session.completed", "invoice.payment_succeeded"):
            # For invoice events, try fetching subscription metadata if user_id missing
            if not user_id_str and event_type == "invoice.payment_succeeded" and sub_id:
                try:
                    sub = stripe.Subscription.retrieve(sub_id)
                    sub_meta = getattr(sub, "metadata", None) or {}
                    user_id_str = sub_meta.get("user_id") if isinstance(sub_meta, dict) else getattr(sub_meta, "user_id", None)
                except Exception as e:
                    logger.warning(f"Could not retrieve subscription metadata: {e}")

            if user_id_str:
                try:
                    user_id = int(user_id_str)
                    db = SessionLocal()
                    try:
                        _upgrade_user(db, user_id)
                    finally:
                        db.close()
                except (ValueError, TypeError):
                    logger.error(f"Invalid user_id in Stripe metadata: {user_id_str}")
            else:
                logger.warning(f"No user_id in metadata for event {event_type}")

    except Exception as e:
        logger.error(f"Stripe webhook processing error: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Webhook processing error")

    return {"received": True}


# ─────────────────────────────── Status ───────────────────────────────────────

@router.get("/status")
def payment_status(current_user: User = Depends(get_current_user)):
    """Returns the current user's subscription status."""
    return {
        "plan_type": current_user.plan_type,
        "subscription_end_at": current_user.subscription_end_at,
    }
