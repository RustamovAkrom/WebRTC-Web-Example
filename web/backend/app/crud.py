"""
crud.py — DB bilan ishlovchi async yordamchilar (foydalanuvchi, xona).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ChatMessage, Room, RoomSession, User
from app.security import hash_password


# --- Users ---

async def get_user_by_username(session: AsyncSession, username: str) -> User | None:
    res = await session.execute(
        select(User).where(func.lower(User.username) == username.lower())
    )
    return res.scalar_one_or_none()


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    res = await session.execute(select(User).where(User.email == email))
    return res.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id: str | uuid.UUID) -> User | None:
    if isinstance(user_id, str):
        try:
            user_id = uuid.UUID(user_id)
        except ValueError:
            return None
    return await session.get(User, user_id)


async def create_user(
    session: AsyncSession,
    *,
    username: str,
    password: str,
    display_name: str,
    email: str | None = None,
) -> User:
    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        display_name=display_name,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def touch_last_login(session: AsyncSession, user: User) -> None:
    user.last_login_at = datetime.now(timezone.utc)
    await session.commit()


# --- Rooms ---

async def get_room_by_slug(session: AsyncSession, slug: str) -> Room | None:
    res = await session.execute(select(Room).where(Room.slug == slug))
    return res.scalar_one_or_none()


async def create_room(
    session: AsyncSession,
    *,
    slug: str,
    owner_user_id: uuid.UUID,
    title: str | None = None,
    is_locked: bool = False,
) -> Room:
    room = Room(
        slug=slug, owner_user_id=owner_user_id, title=title, is_locked=is_locked
    )
    session.add(room)
    await session.commit()
    await session.refresh(room)
    return room


async def patch_room(
    session: AsyncSession,
    room: Room,
    *,
    title: str | None = None,
    is_locked: bool | None = None,
) -> Room:
    if title is not None:
        room.title = title
    if is_locked is not None:
        room.is_locked = is_locked
    await session.commit()
    await session.refresh(room)
    return room


# --- Optional history ---

async def record_room_session(
    session: AsyncSession,
    *,
    room_slug: str,
    display_name: str,
    user_id: uuid.UUID | None = None,
) -> None:
    session.add(
        RoomSession(room_slug=room_slug, display_name=display_name, user_id=user_id)
    )
    await session.commit()


async def add_chat_message(
    session: AsyncSession,
    *,
    room_slug: str,
    display_name: str,
    body: str,
    user_id: uuid.UUID | None = None,
) -> None:
    session.add(
        ChatMessage(
            room_slug=room_slug,
            display_name=display_name,
            body=body,
            user_id=user_id,
        )
    )
    await session.commit()
