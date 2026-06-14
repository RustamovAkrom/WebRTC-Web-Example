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

# Database URL yo'q bo'lsa, engine yaratilmaydi (signaling P2P uchun shart emas)
if settings.async_database_url:
    engine = create_async_engine(
        settings.async_database_url,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        future=True,
    )
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
else:
    engine = None
    SessionLocal = None

print(f"📊 Database: {'configured' if settings.async_database_url else 'not configured (signaling only)'}")
if settings.database_url:
    print(f"   URL: {settings.database_url[:50]}...")


class Base(DeclarativeBase):
    """Barcha ORM modellar uchun baza."""


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency: har so'rov uchun bitta sessiya."""
    if SessionLocal is None:
        raise RuntimeError("Database not configured. Set DATABASE_URL environment variable.")
    async with SessionLocal() as session:
        yield session
