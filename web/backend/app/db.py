"""
db.py — async SQLAlchemy engine, sessiya fabrikasi va Base.

Engine global yaratiladi (pool_pre_ping bilan — uzilgan ulanishlarni tiklaydi).
FastAPI endpointlari `get_session` dependency orqali sessiya oladi.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    """Barcha ORM modellar uchun umumiy baza."""


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency: har so'rov uchun bitta sessiya."""
    async with SessionLocal() as session:
        yield session
