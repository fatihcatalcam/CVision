"""
ReferralService - invite codes, and the reward that only pays for real users.

The reward fires when the invited account completes its FIRST ANALYSIS, not when
it registers. That single choice is what makes the feature safe to ship without
email verification: signing up is free and instant, so paying on signup would be
a credit printer for anyone willing to type a fake address. Paying on a completed
analysis means every fake account costs the abuser a real CV and a real wait, for
three credits - not a trade anyone bothers to make.

An IP check was the other option considered and rejected. Mobile carriers rotate
addresses, so it blocks real users at random; families, dorms and offices share
one, so it blocks real referrals; and a phone hotspot defeats it in seconds. It
fails in both directions at once.
"""

import logging
import secrets
import string
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User
from app.services.credit_service import CreditService

logger = logging.getLogger("cvision.services.referral")

# No look-alike characters: these codes get read off a screen and typed, or
# dictated out loud. 0/O and 1/I/l cost support time for no entropy worth having.
_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
_CODE_LENGTH = 8


def _new_code() -> str:
    return "".join(secrets.choice(_ALPHABET) for _ in range(_CODE_LENGTH))


class ReferralService:
    @staticmethod
    def get_or_create_code(db: Session, user: User) -> str:
        """The user's invite code, minted on first request.

        Retries on collision rather than trusting 31^8 to never repeat - the
        column is unique, so a collision would surface as a 500 on someone
        opening the invite screen.
        """
        if user.referral_code:
            return user.referral_code

        for _ in range(5):
            candidate = _new_code()
            taken = db.query(User).filter(User.referral_code == candidate).first()
            if taken is None:
                user.referral_code = candidate
                db.commit()
                db.refresh(user)
                return candidate

        raise RuntimeError("could not mint a unique referral code after 5 attempts")

    @staticmethod
    def resolve_inviter(db: Session, code: str | None) -> User | None:
        """Find who a code belongs to. Unknown codes are ignored, not rejected:
        a typo in an invite link should not block a signup."""
        if not code:
            return None
        return db.query(User).filter(User.referral_code == code.strip().upper()).first()

    @staticmethod
    def attach_inviter(db: Session, new_user: User, code: str | None) -> None:
        """Record who invited this account, if anyone did."""
        inviter = ReferralService.resolve_inviter(db, code)
        if inviter is None or inviter.id == new_user.id:
            return
        new_user.referred_by_id = inviter.id
        db.commit()

    @staticmethod
    def reward_inviter(db: Session, user: User) -> bool:
        """Pay this account's inviter, once, now that it has produced something.

        Called when the user's first analysis is created. referral_rewarded_at is
        what makes it once-only: the first analysis can be retried, re-run by the
        stuck-job sweep, or raced by two uploads, and none of those may pay twice.
        """
        if user.referred_by_id is None or user.referral_rewarded_at is not None:
            return False

        inviter = db.query(User).filter(User.id == user.referred_by_id).first()
        if inviter is None:
            return False

        # Stamped before the grant so a failure mid-grant cannot leave the door
        # open for a second attempt to pay again.
        user.referral_rewarded_at = datetime.now(timezone.utc)
        db.flush()

        CreditService.grant(
            db, inviter, settings.CREDIT_REFERRAL, "grant_referral", ref_id=str(user.id)
        )
        db.commit()
        logger.info(
            "Referral reward: user %s paid %d credits for inviting user %s",
            inviter.id, settings.CREDIT_REFERRAL, user.id,
        )
        return True

    @staticmethod
    def count_rewarded(db: Session, user: User) -> int:
        """How many invites have actually paid out - the number worth showing on
        the invite screen, since pending signups are not yet worth anything."""
        return (
            db.query(User)
            .filter(User.referred_by_id == user.id, User.referral_rewarded_at.isnot(None))
            .count()
        )
