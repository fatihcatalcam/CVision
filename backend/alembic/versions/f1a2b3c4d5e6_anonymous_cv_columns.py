"""anonymous CV columns: nullable owner, session_token, client_ip

Revision ID: f1a2b3c4d5e6
Revises: a3b4c5d6e7f8
Create Date: 2026-07-11 00:00:00.000000

Supports the public /try flow: a CV can exist with no owner (user_id NULL),
identified by a random session_token, and is claimed onto a user at signup.
client_ip backs the per-IP daily rate limit and is wiped on claim/cleanup.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'a3b4c5d6e7f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Existing rows all have an owner, so dropping NOT NULL is safe.
    op.alter_column('cvs', 'user_id', existing_type=sa.Integer(), nullable=True)
    op.execute("ALTER TABLE cvs ADD COLUMN IF NOT EXISTS session_token VARCHAR(64)")
    op.execute("ALTER TABLE cvs ADD COLUMN IF NOT EXISTS client_ip VARCHAR(64)")
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_cvs_session_token ON cvs (session_token)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_cvs_session_token")
    op.execute("ALTER TABLE cvs DROP COLUMN IF EXISTS client_ip")
    op.execute("ALTER TABLE cvs DROP COLUMN IF EXISTS session_token")
    op.alter_column('cvs', 'user_id', existing_type=sa.Integer(), nullable=False)
