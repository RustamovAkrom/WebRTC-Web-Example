"""
routers/rooms.py — xonalarni egalik qilish (faqat ro'yxatdan o'tgan foydalanuvchilar).

Mehmon/ad-hoc xonalar DB'ga yozilmaydi — ular RoomManager'da in-memory qoladi.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.db import get_session
from app.deps import get_current_user, get_current_user_optional
from app.models import User
from app.schemas import RoomCreate, RoomOut, RoomPatch

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


async def _to_out(db: AsyncSession, room) -> RoomOut:
    owner_name = None
    if room.owner_user_id:
        owner = await crud.get_user_by_id(db, room.owner_user_id)
        owner_name = owner.display_name if owner else None
    return RoomOut(
        slug=room.slug,
        title=room.title,
        owner_user_id=room.owner_user_id,
        owner_display_name=owner_name,
        is_locked=room.is_locked,
        exists=True,
    )


@router.post("", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
async def claim_room(
    body: RoomCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> RoomOut:
    existing = await crud.get_room_by_slug(db, body.slug)
    if existing:
        if existing.owner_user_id == user.id:
            return await _to_out(db, existing)  # idempotent
        raise HTTPException(status.HTTP_409_CONFLICT, "Bu xona allaqachon band")
    room = await crud.create_room(
        db,
        slug=body.slug,
        owner_user_id=user.id,
        title=body.title,
        is_locked=body.is_locked,
    )
    return await _to_out(db, room)


@router.get("/{slug}", response_model=RoomOut)
async def get_room(
    slug: str,
    _user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_session),
) -> RoomOut:
    room = await crud.get_room_by_slug(db, slug)
    if not room:
        # Mehmon xonasi — DB'da yo'q, lekin baribir kirsa bo'ladi.
        return RoomOut(slug=slug, exists=False)
    return await _to_out(db, room)


@router.patch("/{slug}", response_model=RoomOut)
async def update_room(
    slug: str,
    body: RoomPatch,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> RoomOut:
    room = await crud.get_room_by_slug(db, slug)
    if not room:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Xona topilmadi")
    if room.owner_user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Faqat xona egasi o'zgartiradi")
    room = await crud.patch_room(db, room, title=body.title, is_locked=body.is_locked)
    return await _to_out(db, room)
