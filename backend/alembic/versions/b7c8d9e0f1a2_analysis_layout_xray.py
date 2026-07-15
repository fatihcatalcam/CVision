"""analysis_results.layout_xray JSON column (ATS X-Ray)

Revision ID: b7c8d9e0f1a2
Revises: f1a2b3c4d5e6
Create Date: 2026-07-15 00:00:00.000000

Stores the layout X-Ray output (findings + naive-parser view) per analysis.
Nullable: legacy analyses have no layout data; TXT uploads store
{"available": false, "reason": "plain_text"}.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7c8d9e0f1a2'
down_revision: Union[str, None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE analysis_results ADD COLUMN IF NOT EXISTS layout_xray JSON")


def downgrade() -> None:
    op.execute("ALTER TABLE analysis_results DROP COLUMN IF EXISTS layout_xray")
