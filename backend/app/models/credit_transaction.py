"""
CreditTransaction - append-only ledger behind every credit balance change.

users.credits is the fast path, but it is only a cached total: this table is the
record of how it got there. Once credits are sold for money, "I paid and my
balance is wrong" has to be answerable, and a single integer cannot answer it.
History also cannot be reconstructed after the fact - the events are simply gone
- so the ledger has to exist from the first migration, not from the first
dispute.

Rows are never updated or deleted. A correction is another row.

`balance_after` is denormalized on purpose: it lets any row be checked against
the running sum of everything before it, so a lost or double-applied write shows
up as a mismatch instead of quietly becoming the new truth.
"""

from datetime import datetime

from sqlalchemy import String, Integer, DateTime, ForeignKey, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Signed: negative spends, positive grants and purchases.
    delta: Mapped[int] = mapped_column(Integer, nullable=False)
    # Balance immediately after this row was applied - see the module docstring.
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)

    # Why it moved. Stable machine values, not display copy:
    #   spend_analysis | spend_unlock | spend_match | spend_cover_letter
    #   spend_rewrite  | refund_failed_analysis
    #   grant_signup   | grant_weekly | grant_referral | grant_admin
    #   purchase
    reason: Mapped[str] = mapped_column(String(40), nullable=False)

    # What it was for, when there is something to point at - a cv id, an
    # analysis id, a payment reference. Free-form because the referent differs
    # per reason, and a real FK would need one nullable column per target.
    ref_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    user: Mapped["User"] = relationship("User", back_populates="credit_transactions")

    __table_args__ = (
        # The two queries this table serves: one user's statement, newest first.
        Index("ix_credit_tx_user_created", "user_id", "created_at"),
    )

    def __repr__(self) -> str:
        sign = "+" if self.delta >= 0 else ""
        return (
            f"<CreditTransaction(user={self.user_id}, {sign}{self.delta}, "
            f"{self.reason}, after={self.balance_after})>"
        )
