"""
models.py — PostgreSQL jadvallari (SQLAlchemy 2.0 ORM).

UUID birlamchi kalitlar, timestamptz vaqtlar. Faqat egalik qilingan xonalar va
foydalanuvchilar saqlanadi; mehmon xonalari in-memory (RoomManager) qoladi.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _uuid() -> uuid.UUID:
    return uuid.uuid4()


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=_uuid
    )
    username: Mapped[str] = mapped_column(String(32), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(64), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    rooms: Mapped[list["Room"]] = relationship(back_populates="owner")

    __table_args__ = (
        # Case-insensitive unikal username (Ali == ali).
        Index("ix_users_username_lower", func.lower(username), unique=True),
    )


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=_uuid
    )
    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    title: Mapped[str | None] = mapped_column(String(120), nullable=True)
    owner_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    owner: Mapped["User | None"] = relationship(back_populates="rooms")


class RoomSession(Base):
    """Ixtiyoriy: tarix/analitika uchun qo'shilish-chiqish yozuvlari."""

    __tablename__ = "room_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=_uuid
    )
    room_slug: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    display_name: Mapped[str] = mapped_column(String(64), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    left_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class ChatMessage(Base):
    """Ixtiyoriy: PERSIST_CHAT=true bo'lganda chat tarixini saqlaydi."""

    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=_uuid
    )
    room_slug: Mapped[str] = mapped_column(String(64), nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    display_name: Mapped[str] = mapped_column(String(64), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_chat_room_created", "room_slug", "created_at"),
    )
