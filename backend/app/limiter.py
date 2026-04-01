"""
Global rate limiter instance using slowapi.
Placed here to avoid circular imports between main.py and routers.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
