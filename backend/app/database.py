"""
Database engine, session factory, and declarative base.
Supports both SQLite and PostgreSQL via DATABASE_URL.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

# SQLite requires special connect_args to allow multi-threaded access
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=settings.DEBUG,
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        # Supabase closes idle connections; without these the pool hands out
        # dead connections after inactivity and the first query fails. pre_ping
        # validates a connection (SELECT 1) before use and transparently
        # reconnects; recycle proactively drops connections older than 5 min.
        pool_pre_ping=True,
        pool_recycle=300,
        echo=settings.DEBUG,
    )

# Session factory - each request gets its own session via dependency injection
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """
    SQLAlchemy 2.0 declarative base.
    All ORM models inherit from this class.
    """
    pass
