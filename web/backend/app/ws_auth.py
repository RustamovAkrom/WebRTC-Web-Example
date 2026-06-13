"""
ws_auth.py — WebSocket ulanishida identifikatsiya.

Token (WS ticket yoki sessiya JWT) bo'lsa — ro'yxatdan o'tgan foydalanuvchi.
Token bo'lmasa yoki yaroqsiz bo'lsa — MEHMON. Hech qachon xato ko'tarmaydi
(mehmon yo'li har doim ishlashi shart).
"""

from __future__ import annotations

from dataclasses import dataclass

from app.security import decode_token


@dataclass
class Identity:
    kind: str  # "user" | "guest"
    user_id: str | None = None
    display_name: str | None = None

    @property
    def is_authenticated(self) -> bool:
        return self.kind == "user"


def identify_ws(token: str | None) -> Identity:
    if not token:
        return Identity(kind="guest")
    claims = decode_token(token)
    if not claims or not claims.get("sub"):
        return Identity(kind="guest")
    return Identity(
        kind="user",
        user_id=claims["sub"],
        display_name=claims.get("display_name"),
    )
