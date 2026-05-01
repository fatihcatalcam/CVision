"""
Password hashing utilities using bcrypt directly.
Maps to NFR4.
"""

import bcrypt
import json


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    password_bytes = plain_password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its bcrypt hash."""
    password_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def check_password_history(plain_password: str, history_json: str | None) -> bool:
    """Check if plain_password matches any of the last 3 stored password hashes."""
    if not history_json:
        return False

    try:
        history = json.loads(history_json)
        if not isinstance(history, list):
            return False

        for hashed in history:
            if verify_password(plain_password, hashed):
                return True
    except (json.JSONDecodeError, TypeError):
        pass

    return False


def update_password_history(current_hash: str, history_json: str | None) -> str:
    """Store current password hash in history, keep only last 3."""
    try:
        history = json.loads(history_json) if history_json else []
        if not isinstance(history, list):
            history = []
    except (json.JSONDecodeError, TypeError):
        history = []

    # Add current hash to the beginning
    history.insert(0, current_hash)

    # Keep only last 3
    history = history[:3]

    return json.dumps(history)
