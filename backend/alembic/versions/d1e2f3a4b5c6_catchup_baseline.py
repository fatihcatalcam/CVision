"""catch-up baseline: objects previously created by raw ALTER patches

Revision ID: d1e2f3a4b5c6
Revises: f3a1b2c4d5e6
Create Date: 2026-05-31 00:00:00.000000

Captures schema that production previously got from the raw ALTER TABLE
patches in main.py's lifespan (Google OAuth, JD/match/cover-letter tables,
snippets, subscription/reset fields, etc.). All statements are IF NOT EXISTS
so this is a harmless no-op on the existing prod DB and a full builder on a
fresh DB. The live prod DB is baselined to THIS revision (alembic stamp),
which is handled automatically by app/db_migrations.run_migrations().
"""
from typing import Sequence, Union

from alembic import op


revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, None] = 'f3a1b2c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_STATEMENTS = [
    # users: subscription / billing
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end_at TIMESTAMPTZ",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100)",
    # users: password reset flow
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code VARCHAR(10)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_expires_at TIMESTAMP",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_attempts INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_history VARCHAR(1000)",
    # users: Google OAuth
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)",
    "ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL",
    # role_profiles: domain
    "ALTER TABLE role_profiles ADD COLUMN IF NOT EXISTS domain VARCHAR(100)",
    # suggestions: snippets
    "ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS snippets JSON",
    # JD matching + cover letters
    """CREATE TABLE IF NOT EXISTS job_descriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title VARCHAR(255),
        company VARCHAR(255),
        url VARCHAR(500),
        raw_text TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    )""",
    "CREATE INDEX IF NOT EXISTS ix_job_descriptions_user_id ON job_descriptions(user_id)",
    """CREATE TABLE IF NOT EXISTS cv_jd_matches (
        id SERIAL PRIMARY KEY,
        cv_id INTEGER NOT NULL REFERENCES cvs(id),
        jd_id INTEGER NOT NULL REFERENCES job_descriptions(id),
        match_score INTEGER NOT NULL,
        summary TEXT,
        matched_keywords JSON,
        missing_keywords JSON,
        gap_analysis JSON,
        created_at TIMESTAMPTZ DEFAULT NOW()
    )""",
    "CREATE INDEX IF NOT EXISTS ix_cv_jd_matches_cv_id ON cv_jd_matches(cv_id)",
    "CREATE INDEX IF NOT EXISTS ix_cv_jd_matches_jd_id ON cv_jd_matches(jd_id)",
    """CREATE TABLE IF NOT EXISTS cover_letters (
        id SERIAL PRIMARY KEY,
        cv_id INTEGER NOT NULL REFERENCES cvs(id),
        jd_id INTEGER NOT NULL REFERENCES job_descriptions(id),
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    )""",
    "CREATE INDEX IF NOT EXISTS ix_cover_letters_cv_id ON cover_letters(cv_id)",
]


def upgrade() -> None:
    for stmt in _STATEMENTS:
        op.execute(stmt)


def downgrade() -> None:
    # No-op: this revision only reconciles pre-existing prod schema and must
    # never drop columns/tables that older migrations or live data depend on.
    pass
