"""
routers/auth.py — ro'yxatdan o'tish, kirish, chiqish, joriy foydalanuvchi, WS ticket.

Sessiya JWT httpOnly cookie'ga yoziladi (XSS'dan himoya). Auth endpointlari
slowapi bilan tezlik cheklangan.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.config import get_settings
from app.db import get_session
from app.deps import get_current_user, get_current_user_optional
from app.models import User
from app.ratelimit import limiter
from app.schemas import TokenOut, UserCreate, UserLogin, UserOut, WsTicketOut
from app.security import create_access_token, create_ws_ticket, verify_password

settings = get_settings()
router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
        max_age=settings.access_token_ttl_min * 60,
        path="/",
    )


def _token_for(user: User) -> str:
    return create_access_token(
        str(user.id),
        {"username": user.username, "display_name": user.display_name},
    )


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    body: UserCreate,
    response: Response,
    db: AsyncSession = Depends(get_session),
) -> TokenOut:
    if await crud.get_user_by_username(db, body.username):
        raise HTTPException(status.HTTP_409_CONFLICT, "Bu username band")
    if body.email and await crud.get_user_by_email(db, body.email):
        raise HTTPException(status.HTTP_409_CONFLICT, "Bu email band")

    user = await crud.create_user(
        db,
        username=body.username,
        password=body.password,
        display_name=body.display_name,
        email=body.email,
    )
    _set_session_cookie(response, _token_for(user))
    return TokenOut(user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
@limiter.limit("10/minute")
async def login(
    request: Request,
    body: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_session),
) -> TokenOut:
    user = await crud.get_user_by_username(db, body.username)
    # Foydalanuvchi sanab chiqishni oldini olish: umumiy xato xabari.
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Username yoki parol noto'g'ri"
        )
    await crud.touch_last_login(db, user)
    _set_session_cookie(response, _token_for(user))
    return TokenOut(user=UserOut.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> Response:
    response.delete_cookie(key=settings.cookie_name, path="/")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserOut | None)
async def me(user: User | None = Depends(get_current_user_optional)) -> UserOut | None:
    if user is None:
        return None
    return UserOut.model_validate(user)


@router.get("/ws-ticket", response_model=WsTicketOut)
async def ws_ticket(user: User = Depends(get_current_user)) -> WsTicketOut:
    """WS ulanish uchun qisqa muddatli (1 daqiqa) ticket beradi."""
    ticket = create_ws_ticket(
        str(user.id),
        {"username": user.username, "display_name": user.display_name},
    )
    return WsTicketOut(ticket=ticket)
