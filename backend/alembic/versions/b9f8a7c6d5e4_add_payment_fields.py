"""add payment fields

Revision ID: b9f8a7c6d5e4
Revises: 1c9a896fcc3c
Create Date: 2026-04-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9f8a7c6d5e4'
down_revision: Union[str, None] = '1c9a896fcc3c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('subscription_end_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('stripe_customer_id', sa.String(length=100), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('stripe_customer_id')
        batch_op.drop_column('subscription_end_at')
