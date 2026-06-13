"""
deps.py — FastAPI auth dependency'lari.

`get_current_user`          — token shart (yo'q bo'lsa 401).
`get_current_user_optional` — token ixtiyoriy (mehmon uchun None qaytaradi).

Token ikki joydan o'qiladi: `Authorization: Bearer ...` sarlavhasi yoki
httpOnly sessiya cookie'si.
"""

from __future__ import annotations

from fastapi import Cookie, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.config import get_settings
from app.db import get_session
from app.models import User
from app.security import decode_token

settings = get_settings()


def _extract_token(
    authorization: str | None, cookie_token: str | None
) -> str | None:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return cookie_token


async def get_current_user_optional(
    authorization: str | None = Header(default=None),
    session_cookie: str | None = Cookie(default=None, alias=settings.cookie_name),
    db: AsyncSession = Depends(get_session),
) -> User | None:
    token = _extract_token(authorization, session_cookie)
    if not token:
        return None
    claims = decode_token(token)
    if not claims:
        return None
    # WS ticket'lari REST uchun emas.
    if claims.get("scope") == "ws":
        return None
    sub = claims.get("sub")
    if not sub:
        return None
    return await crud.get_user_by_id(db, sub)


async def get_current_user(
    user: User | None = Depends(get_current_user_optional),
) -> User:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Avtorizatsiya talab qilinadi",
        )
    return user
