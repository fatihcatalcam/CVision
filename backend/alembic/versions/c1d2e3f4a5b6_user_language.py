"""users.language column for transactional email language

Revision ID: c1d2e3f4a5b6
Revises: b7c8d9e0f1a2
Create Date: 2026-08-03 00:00:00.000000

Stores the UI language the account was created in, so welcome and password-reset
mails go out in a language the user actually reads. Before this there was no
signal at all: the welcome mail was hardcoded English and the reset mail
hardcoded Turkish, so every user got at least one of them wrong.

Nullable on purpose. Existing rows predate the field and there is nothing
truthful to backfill them with - the email layer falls back to English for NULL.
Stores the raw UI code ('tr', 'en', 'es', 'de', 'fr') rather than a collapsed
tr/en flag, so adding a third mail language later needs no data migration.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, None] = 'b7c8d9e0f1a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('language', sa.String(length=5), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'language')
