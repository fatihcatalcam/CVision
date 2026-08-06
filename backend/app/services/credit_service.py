"""
CreditService - the only place a credit balance is allowed to change.

Two rules the rest of the codebase depends on:

  1. `users.credits` and `credit_transactions` move together, always. The column
     is a cached total; the ledger is the record of how it got there. Anything
     that writes one without the other breaks the reconciliation that makes a
     disputed balance answerable.

  2. A balance can never go negative. The comparison lives in the UPDATE's WHERE
     clause, not in Python, so the database arbitrates. Reading the balance,
     checking it, then writing is the classic double-spend: two requests arriving
     together both read the same number and both pass the check.
"""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.models.credit_transaction import CreditTransaction
from app.models.user import User

logger = logging.getLogger("cvision.services.credit")


class InsufficientCredits(Exception):
    """Raised when a spend would take the balance below zero.

    Carries the numbers so the caller can tell the user what they are short by
    without a second query.
    """

    def __init__(self, needed: int, available: int):
        self.needed = needed
        self.available = available
        super().__init__(f"needs {needed} credits, has {available}")


class CreditService:
    """All balance movement. Static: there is no per-instance state worth having."""

    @staticmethod
    def balance(db: Session, user: User) -> int:
        """The user's current balance, read from the database rather than from a
        possibly-stale identity-mapped object."""
        return db.execute(
            text("SELECT credits FROM users WHERE id = :uid"), {"uid": user.id}
        ).scalar_one()

    @staticmethod
    def spend(
        db: Session, user: User, amount: int, reason: str, ref_id: str | None = None
    ) -> int:
        """Take `amount` credits, or raise InsufficientCredits and change nothing.

        Returns the new balance.
        """
        if amount <= 0:
            raise ValueError(f"spend amount must be positive, got {amount}")

        # The guard is the WHERE clause: if the balance moved underneath us, the
        # row does not match and nothing is written. RETURNING gives the balance
        # after the change in the same statement, so there is no window where
        # someone else's write could land between the update and the read.
        row = db.execute(
            text(
                "UPDATE users SET credits = credits - :amount "
                "WHERE id = :uid AND credits >= :amount "
                "RETURNING credits"
            ),
            {"amount": amount, "uid": user.id},
        ).fetchone()

        if row is None:
            available = CreditService.balance(db, user)
            logger.info(
                "Refused spend of %d (%s) for user %s: balance %d",
                amount, reason, user.id, available,
            )
            raise InsufficientCredits(needed=amount, available=available)

        new_balance = row[0]
        CreditService._record(db, user, -amount, new_balance, reason, ref_id)
        return new_balance

    @staticmethod
    def grant(
        db: Session, user: User, amount: int, reason: str, ref_id: str | None = None
    ) -> int:
        """Add `amount` credits. Returns the new balance.

        Deliberately has no cap. Callers decide what a cap means for them - the
        weekly grant skips itself when the balance is already high, a purchase
        never does - and burying that here would make one of those wrong.
        """
        if amount <= 0:
            raise ValueError(f"grant amount must be positive, got {amount}")

        new_balance = db.execute(
            text(
                "UPDATE users SET credits = credits + :amount "
                "WHERE id = :uid RETURNING credits"
            ),
            {"amount": amount, "uid": user.id},
        ).scalar_one()

        CreditService._record(db, user, amount, new_balance, reason, ref_id)
        return new_balance

    @staticmethod
    def open_account(db: Session, user: User) -> int:
        """Give a brand-new account its opening balance and start its clock.

        One function rather than two lines at each signup, because there is more
        than one way into the product - email/password and Google - and a path
        that forgets this creates an account with nothing in it that cannot do
        anything. Starting the clock matters as much as the credits: a null
        credits_granted_at reads as "never granted", so the first page load would
        add a weekly grant on top and the account would open above its intended
        balance.
        """
        balance = CreditService.grant(db, user, settings.CREDIT_SIGNUP, "grant_signup")
        user.credits_granted_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
        return balance

    @staticmethod
    def claim_weekly_grant(db: Session, user: User) -> bool:
        """Hand out the weekly credits if a week has passed. Returns whether it did.

        Claimed on arrival rather than accrued on a schedule: an account away for
        five weeks collects one grant when it returns, not five. The balance is
        meant to reward turning up, and a cron job would reward merely existing.

        The cap is a gate, not a ceiling. At or above it the grant is skipped -
        but the clock advances either way, so a balance sitting high for months
        cannot bank the missed weeks and collect them all at once the moment it
        drops. A grant that lands just under the cap is allowed to overshoot it;
        clamping to an exact total buys nothing and makes the rule harder to say
        out loud.
        """
        now = datetime.now(timezone.utc)
        last = user.credits_granted_at
        if last is not None and last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)

        if last is not None and now - last < timedelta(days=7):
            return False

        user.credits_granted_at = now
        granted = False
        if CreditService.balance(db, user) < settings.CREDIT_WEEKLY_CAP:
            CreditService.grant(db, user, settings.CREDIT_WEEKLY, "grant_weekly")
            granted = True

        db.commit()
        db.refresh(user)
        return granted

    @staticmethod
    def refund(
        db: Session, user: User, amount: int, reason: str, ref_id: str | None = None
    ) -> int:
        """Give credits back for work that did not happen.

        Mechanically a grant; kept separate so the intent is legible at the call
        site and the ledger reads correctly when someone asks why their balance
        went up.
        """
        return CreditService.grant(db, user, amount, reason, ref_id)

    @staticmethod
    def _record(
        db: Session, user: User, delta: int, balance_after: int,
        reason: str, ref_id: str | None,
    ) -> None:
        db.add(CreditTransaction(
            user_id=user.id, delta=delta, balance_after=balance_after,
            reason=reason, ref_id=ref_id,
        ))
        db.flush()
        # The raw UPDATE bypassed the identity map, so the in-memory object still
        # holds the old number. Refresh it or the caller sees a stale balance -
        # and callers do read user.credits right after spending.
        db.refresh(user)
