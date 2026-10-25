"""users email verification - a code before an email signup can sign in

Revision ID: a7b8c9d0e1f2
Revises: f4a5b6c7d8e9
Create Date: 2026-10-25 00:00:00.000000

Email/password signups were being made with invented and throwaway addresses
to collect the free credits. From here on such a signup is mailed a 6-digit
code and cannot sign in until it is entered.

Every account that exists when this runs is marked verified, dated to its
creation. They signed up under the old rules, and the decision was to leave
them alone rather than stop every existing user at their next login.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, None] = 'f4a5b6c7d8e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('verify_code', sa.String(length=10), nullable=True))
    op.add_column('users', sa.Column('verify_code_expires_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('verify_code_sent_at', sa.DateTime(), nullable=True))
    op.add_column(
        'users',
        sa.Column('verify_code_attempts', sa.Integer(), nullable=False, server_default='0'),
    )
    op.execute("UPDATE users SET email_verified_at = COALESCE(created_at, CURRENT_TIMESTAMP)")


def downgrade() -> None:
    op.drop_column('users', 'verify_code_attempts')
    op.drop_column('users', 'verify_code_sent_at')
    op.drop_column('users', 'verify_code_expires_at')
    op.drop_column('users', 'verify_code')
    op.drop_column('users', 'email_verified_at')
