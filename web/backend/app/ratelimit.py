"""
ratelimit.py — slowapi asosida tezlik cheklovi (IP bo'yicha).

Auth endpointlarini brute-force'dan himoya qiladi.
"""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
