"""add lemon_subscription_id to users

Revision ID: a3b4c5d6e7f8
Revises: d1e2f3a4b5c6
Create Date: 2026-06-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a3b4c5d6e7f8'
down_revision: Union[str, None] = 'e2f3a4b5c6d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('lemon_subscription_id', sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'lemon_subscription_id')
