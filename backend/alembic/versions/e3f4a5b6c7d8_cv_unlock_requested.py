"""cvs.unlock_requested - the full report was paid for at upload

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-08-06 00:00:00.000000

A "Pro analysis" is bought before the analysis exists, so the intent has to
survive from the upload request to the background task that creates the report.
The alternative - charging the unlock again once the analysis lands - can fail
after the money is taken, which is the one outcome worth designing around.

Defaults to false: every existing CV was analysed under the old rules, and their
reports already carry their own is_unlocked.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e3f4a5b6c7d8'
down_revision: Union[str, None] = 'd2e3f4a5b6c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'cvs',
        sa.Column('unlock_requested', sa.Boolean(), nullable=False,
                  server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column('cvs', 'unlock_requested')
