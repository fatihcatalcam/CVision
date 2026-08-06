"""credit balances, per-report unlock, and the credit ledger

Revision ID: d2e3f4a5b6c7
Revises: c1d2e3f4a5b6
Create Date: 2026-08-05 00:00:00.000000

Replaces the weekly quota (users.analysis_count / quota_reset_at) and the
premium feature gate (users.plan_type) with a single currency.

Existing rows are given an opening balance rather than being left at zero, which
would lock every current user out on deploy. Nobody is paying yet, so this is
the cheapest moment this change will ever have.

The backfill writes credit_transactions rows too. The ledger has to be complete
from its first row or balance_after means nothing, and "where did my opening
balance come from" is exactly the question it exists to answer.

analysis_count, quota_reset_at and plan_type are deliberately left in place. The
code stops reading them in a later step; dropping columns is a separate,
irreversible decision and there is no reason to couple the two.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd2e3f4a5b6c7'
down_revision: Union[str, None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# A new account's opening balance: one analysis plus its unlock.
SIGNUP_CREDITS = 3
# Accounts already flagged premium (the founder's own, and one granted by hand)
# keep working through a balance instead of a plan flag, so there is exactly one
# code path afterwards.
PREMIUM_CREDITS = 50


def upgrade() -> None:
    op.add_column('users', sa.Column('credits', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('credits_granted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        'analysis_results',
        sa.Column('is_unlocked', sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    # Referral. referral_code is nullable and minted on first request rather
    # than backfilled: most accounts never open the invite screen, and a
    # migration that mints one per row would have to guarantee uniqueness in SQL
    # for no benefit.
    op.add_column('users', sa.Column('referral_code', sa.String(length=12), nullable=True))
    op.add_column('users', sa.Column('referred_by_id', sa.Integer(), nullable=True))
    op.add_column(
        'users',
        sa.Column('referral_rewarded_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_users_referral_code', 'users', ['referral_code'], unique=True)
    op.create_foreign_key(
        'fk_users_referred_by', 'users', 'users',
        ['referred_by_id'], ['id'], ondelete='SET NULL',
    )

    op.create_table(
        'credit_transactions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('delta', sa.Integer(), nullable=False),
        sa.Column('balance_after', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(length=40), nullable=False),
        sa.Column('ref_id', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_credit_transactions_user_id', 'credit_transactions', ['user_id'])
    op.create_index('ix_credit_transactions_created_at', 'credit_transactions', ['created_at'])
    op.create_index('ix_credit_tx_user_created', 'credit_transactions', ['user_id', 'created_at'])

    # Opening balances. Reports already unlocked under the old rules stay
    # unlocked: a premium user who paid for those results must not find them
    # re-locked because the rules changed underneath them.
    conn = op.get_bind()
    # credits_granted_at starts the weekly clock now rather than staying null.
    # A null reads as "never granted", so every existing user would collect a
    # weekly grant on their first page load after deploy, on top of the opening
    # balance they just received here.
    conn.execute(
        sa.text(
            "UPDATE users SET credits = CASE WHEN plan_type = 'premium' "
            "THEN :premium ELSE :signup END, credits_granted_at = now()"
        ),
        {"premium": PREMIUM_CREDITS, "signup": SIGNUP_CREDITS},
    )
    conn.execute(
        sa.text(
            "UPDATE analysis_results SET is_unlocked = true WHERE cv_id IN ("
            "  SELECT c.id FROM cvs c JOIN users u ON u.id = c.user_id"
            "  WHERE u.plan_type = 'premium')"
        )
    )
    conn.execute(
        sa.text(
            "INSERT INTO credit_transactions "
            "(user_id, delta, balance_after, reason, created_at) "
            "SELECT id, credits, credits, 'grant_migration', now() FROM users"
        )
    )


def downgrade() -> None:
    op.drop_index('ix_credit_tx_user_created', table_name='credit_transactions')
    op.drop_index('ix_credit_transactions_created_at', table_name='credit_transactions')
    op.drop_index('ix_credit_transactions_user_id', table_name='credit_transactions')
    op.drop_table('credit_transactions')
    op.drop_column('analysis_results', 'is_unlocked')
    op.drop_column('users', 'credits_granted_at')
    op.drop_column('users', 'credits')
