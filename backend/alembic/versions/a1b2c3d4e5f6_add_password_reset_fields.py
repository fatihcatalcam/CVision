"""add password reset fields

Revision ID: a1b2c3d4e5f6
Revises: b9f8a7c6d5e4
Create Date: 2026-05-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'b9f8a7c6d5e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('reset_code', sa.String(length=10), nullable=True))
        batch_op.add_column(sa.Column('reset_code_expires_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('reset_code_attempts', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('password_changed_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('password_history', sa.String(length=1000), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('password_history')
        batch_op.drop_column('password_changed_at')
        batch_op.drop_column('reset_code_attempts')
        batch_op.drop_column('reset_code_expires_at')
        batch_op.drop_column('reset_code')
