"""analysis_results.detected_domain - keep what the AI read the CV as

Revision ID: f4a5b6c7d8e9
Revises: e3f4a5b6c7d8
Create Date: 2026-08-07 00:00:00.000000

The AI already decides which field a CV actually belongs to, judged from its
content rather than the user's dropdown, and the pipeline uses it to regenerate
career recommendations - then throws it away. So the one number that answers
"is our domain list good enough" was being computed on every analysis and
discarded.

It matters because the HQ chart plots cvs.target_domain, which is what the user
SELECTED, and "Other" is the pre-selected value in the uploader. A chart full of
"Other" therefore says "nobody touches the dropdown", not "our domains are
insufficient" - two problems with completely different fixes. Storing the
detected value lets the panel show both and tell them apart.

Nullable, with no backfill: the value was never persisted, so every existing row
genuinely does not have one, and re-deriving it would mean paying for an AI call
per historical analysis. New analyses fill it from here on.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f4a5b6c7d8e9'
down_revision: Union[str, None] = 'e3f4a5b6c7d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'analysis_results',
        sa.Column('detected_domain', sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('analysis_results', 'detected_domain')
