"""add file_content to cvs

Revision ID: f3a1b2c4d5e6
Revises: a1b2c3d4e5f6
Create Date: 2026-05-26 00:00:00.000000

Stores raw file bytes in the database so CVs remain accessible even after
Render's ephemeral filesystem wipes uploaded files on restart/redeploy.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f3a1b2c4d5e6'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('cvs', schema=None) as batch_op:
        batch_op.add_column(sa.Column('file_content', sa.LargeBinary(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('cvs', schema=None) as batch_op:
        batch_op.drop_column('file_content')
