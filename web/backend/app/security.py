"""
security.py — parol hashlash va JWT tokenlar.

Parollar passlib (bcrypt) bilan hashlanadi. JWT HS256 bilan imzolanadi;
`sub` = user UUID, ichida username/display_name ham bo'ladi.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from passlib.context import CryptContext

from app.config import get_settings

settings = get_settings()

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _pwd.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _pwd.verify(password, password_hash)
    except ValueError:
        return False


def create_access_token(
    sub: str, extra: dict[str, Any] | None = None, ttl_min: int | None = None
) -> str:
    """Sessiya JWT yaratadi. sub = user id (str)."""
    now = datetime.now(timezone.utc)
    ttl = ttl_min if ttl_min is not None else settings.access_token_ttl_min
    payload: dict[str, Any] = {
        "sub": sub,
        "iat": now,
        "exp": now + timedelta(minutes=ttl),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)


def decode_token(token: str) -> dict[str, Any] | None:
    """Tokenni tekshiradi. Yaroqsiz/muddati o'tgan bo'lsa None qaytaradi."""
    try:
        return jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_alg]
        )
    except jwt.PyJWTError:
        return None


# WS uchun qisqa muddatli "ticket" — httpOnly cookie'dan JS token o'qiy olmagani
# uchun, frontend ulanishdan oldin shu maxsus qisqa tokenni oladi.
WS_TICKET_TTL_MIN = 1


def create_ws_ticket(sub: str, extra: dict[str, Any] | None = None) -> str:
    payload = dict(extra or {})
    payload["scope"] = "ws"
    return create_access_token(sub, payload, ttl_min=WS_TICKET_TTL_MIN)
