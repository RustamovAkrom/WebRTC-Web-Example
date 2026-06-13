"""
schemas.py — REST so'rov/javob Pydantic modellari.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

_USERNAME_RE = re.compile(r"^[a-zA-Z0-9_.-]{3,32}$")


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    email: EmailStr | None = None
    password: str = Field(min_length=6, max_length=128)
    display_name: str = Field(min_length=1, max_length=64)

    @field_validator("username")
    @classmethod
    def _valid_username(cls, v: str) -> str:
        if not _USERNAME_RE.match(v):
            raise ValueError(
                "username faqat harf, raqam, . _ - belgilaridan iborat (3-32)"
            )
        return v


class UserLogin(BaseModel):
    username: str = Field(min_length=1, max_length=32)
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    id: uuid.UUID
    username: str
    email: EmailStr | None = None
    display_name: str
    avatar_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    user: UserOut


class WsTicketOut(BaseModel):
    ticket: str


class RoomCreate(BaseModel):
    slug: str = Field(min_length=1, max_length=64)
    title: str | None = Field(default=None, max_length=120)
    is_locked: bool = False

    @field_validator("slug")
    @classmethod
    def _valid_slug(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9_-]{1,64}$", v):
            raise ValueError("slug faqat harf, raqam, _ - belgilaridan iborat")
        return v


class RoomPatch(BaseModel):
    title: str | None = Field(default=None, max_length=120)
    is_locked: bool | None = None


class RoomOut(BaseModel):
    slug: str
    title: str | None = None
    owner_user_id: uuid.UUID | None = None
    owner_display_name: str | None = None
    is_locked: bool = False
    exists: bool = True

    model_config = {"from_attributes": True}
