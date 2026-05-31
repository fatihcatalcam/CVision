"""add job-recovery columns to cvs

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-05-31 00:01:00.000000

Adds processing_started_at + retry_count used by the startup recovery sweep.
This is the FIRST genuinely-new migration after the catch-up baseline, so a
stamped prod DB receives these columns when it runs `alembic upgrade head`.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e2f3a4b5c6d7'
down_revision: Union[str, None] = 'd1e2f3a4b5c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE cvs ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ"
    )
    op.execute(
        "ALTER TABLE cvs ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0"
    )


def downgrade() -> None:
    with op.batch_alter_table('cvs', schema=None) as batch_op:
        batch_op.drop_column('retry_count')
        batch_op.drop_column('processing_started_at')
