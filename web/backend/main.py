"""
main.py — WebRTC video chat SIGNALING + REST API serveri (FastAPI).

Vazifalari:
  - `/ws/{room}` — WebRTC offer/answer/ICE relay + host/moderator protokoli.
  - `/api/auth/*`, `/api/rooms/*` — foydalanuvchi akkauntlari va xona egaligi.
  - `/health` — holat (DB bilan).
  - Production'da qurilgan React SPA'ni ham shu server beradi (bitta-konteyner).

Media oqimi BRAUZERLAR orasida P2P boradi; server faqat "tanishtiruvchi".
Host/moderator imtiyozlari faqat SERVER tomonda tekshiriladi (clientlar bir-biriga
ishonmaydi).
"""

from __future__ import annotations

import os
import subprocess
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

from app.config import get_settings
from app.db import SessionLocal, engine
from app.logging_conf import setup_logging
from app.ratelimit import limiter
from app.routers import auth as auth_router
from app.routers import rooms as rooms_router
from app.ws_auth import identify_ws
from rooms import RoomManager

settings = get_settings()


async def run_migration():
    """Database migratsiyasini ishga tushirish."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("⚠️  DATABASE_URL topilmadi, migration o'tkazib yuboriladi")
        return

    try:
        print("🔄 Running database migrations...")
        # Dockerfile'da backend fayllar /app/ da
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd="/app",
            capture_output=True,
            text=True,
            timeout=30,
            env={**os.environ, "DATABASE_URL": db_url}
        )
        if result.returncode == 0:
            print("✅ Database migrations completed successfully")
        else:
            print(f"⚠️  Migration stderr: {result.stderr}")
            print(f"⚠️  Migration stdout: {result.stdout}")
    except Exception as e:
        print(f"⚠️  Migration failed: {e}. Server continues without migrations.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    settings.validate_for_prod()

    # Migration ishga tushirish
    await run_migration()

    yield
    await engine.dispose()


app = FastAPI(title="WebRTC Video Chat", lifespan=lifespan)

# CORS — env'dan boshqariladi (prod'da "*" emas). Cookie auth uchun credentials kerak.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def _rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": "Juda ko'p urinish. Birozdan keyin qayta urining."},
    )


# REST routerlar (/api ostida — SPA mount va /ws bilan to'qnashmaydi)
app.include_router(auth_router.router)
app.include_router(rooms_router.router)

manager = RoomManager()

RELAY_TYPES = {"offer", "answer", "ice"}
BROADCAST_TYPES = {"chat", "state", "reaction"}
HOST_TYPES = {
    "host:force-mute",
    "host:kick",
    "host:spotlight",
    "host:lock",
    "host:transfer",
}


@app.get("/health")
async def health() -> JSONResponse:
    # Liveness: jarayon tirik bo'lsa 200 qaytaramiz (platforma restart qilib
    # yubormasligi uchun). DB holati alohida maydonda ko'rsatiladi.
    db_ok = True
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_ok = False
    return JSONResponse(
        status_code=200,
        content={"status": "ok", "db": "ok" if db_ok else "down"},
    )


async def _load_owner_if_needed(room: str) -> None:
    """Xona egasini (va lock holatini) DB'dan bir marta yuklaymiz."""
    if manager.owner_loaded(room):
        return
    try:
        async with SessionLocal() as db:
            from app import crud

            row = await crud.get_room_by_slug(db, room)
            if row:
                owner = str(row.owner_user_id) if row.owner_user_id else None
                manager.set_owner(room, owner)
                manager.set_locked(room, row.is_locked)
            else:
                manager.set_owner(room, None)
    except Exception:
        # DB ishlamasa ham signaling ishlashda davom etsin (mehmon xonasi sifatida).
        manager.set_owner(room, None)


async def _handle_host_command(room: str, peer_id: str, msg: dict) -> None:
    """Host komandasi — faqat host bo'lsa bajariladi (server avtoriteti)."""
    if not manager.is_host(room, peer_id):
        return
    mtype = msg.get("type")
    target = msg.get("target")

    if mtype == "host:force-mute" and target and manager.has_peer(room, target):
        manager.set_forced_mute(target, True)
        await manager.send_to(room, target, {"type": "force-muted", "by": peer_id})

    elif mtype == "host:kick" and target and manager.has_peer(room, target):
        await manager.send_to(room, target, {"type": "kicked", "reason": "host"})
        ws = manager.socket_of(room, target)
        if ws is not None:
            await ws.close(code=4000)  # target'ning finally bloki tozalaydi

    elif mtype == "host:spotlight":
        tgt = target if (target and manager.has_peer(room, target)) else None
        manager.set_spotlight(room, tgt)
        await manager.broadcast(room, {"type": "spotlight", "peerId": tgt})

    elif mtype == "host:lock":
        locked = bool(msg.get("locked"))
        manager.set_locked(room, locked)
        await manager.broadcast(room, {"type": "lock-changed", "locked": locked})
        await _persist_lock(room, locked)

    elif mtype == "host:transfer" and target and manager.has_peer(room, target):
        manager.set_host(room, target)
        await manager.broadcast(room, {"type": "host-changed", "hostPeerId": target})


async def _persist_lock(room: str, locked: bool) -> None:
    """Egali xona bo'lsa lock holatini DB'ga saqlaymiz."""
    if not manager.owner_of(room):
        return
    try:
        async with SessionLocal() as db:
            from app import crud

            row = await crud.get_room_by_slug(db, room)
            if row:
                await crud.patch_room(db, row, is_locked=locked)
    except Exception:
        pass


@app.websocket("/ws/{room}")
async def signaling(websocket: WebSocket, room: str) -> None:
    await websocket.accept()

    name = websocket.query_params.get("name", "Anon")
    token = websocket.query_params.get("token")
    identity = identify_ws(token)
    if identity.is_authenticated and identity.display_name:
        name = identity.display_name  # server ishonadigan ism

    peer_id = manager.new_peer_id()

    # Egalik/lock holatini yuklaymiz (host qoidasi uchun).
    await _load_owner_if_needed(room)

    # Lock: qulflangan xonaga faqat egasi kira oladi.
    if manager.is_locked(room) and identity.user_id != manager.owner_of(room):
        await websocket.send_json({"type": "rejected", "reason": "locked"})
        await websocket.close(code=4001)
        return

    await manager.add(
        room, peer_id, name, websocket, identity.user_id, identity.is_authenticated
    )

    # Host'ni aniqlaymiz (birinchi kirgan yoki egasi transfer).
    existing = [
        {"peerId": pid, "name": manager.name_of(pid)}
        for pid in manager.peers(room, exclude=peer_id)
    ]
    host_changed = manager.assign_host_on_join(room, peer_id)

    # 1. Yangi peer'ga welcome — host/ega/spotlight/lock ma'lumoti bilan.
    await websocket.send_json(
        {
            "type": "welcome",
            "peerId": peer_id,
            "peers": existing,
            "hostPeerId": manager.host_of(room),
            "ownerUserId": manager.owner_of(room),
            "spotlightPeerId": manager.spotlight_of(room),
            "locked": manager.is_locked(room),
        }
    )

    # 2. Boshqalarga yangi peer qo'shilganini bildiramiz.
    await manager.broadcast(
        room,
        {"type": "peer-joined", "peerId": peer_id, "name": name},
        exclude=peer_id,
    )

    # 3. Agar egasi kelib host transfer bo'lgan bo'lsa — hammaga e'lon qilamiz.
    if host_changed and existing:
        await manager.broadcast(
            room, {"type": "host-changed", "hostPeerId": host_changed}
        )

    try:
        while True:
            msg = await websocket.receive_json()
            mtype = msg.get("type")
            target = msg.get("to")

            if mtype in RELAY_TYPES and target:
                msg["from"] = peer_id
                await manager.send_to(room, target, msg)
            elif mtype in BROADCAST_TYPES:
                msg["from"] = peer_id
                msg["name"] = manager.name_of(peer_id)
                await manager.broadcast(room, msg, exclude=peer_id)
                if mtype == "chat" and settings.persist_chat:
                    await _persist_chat(room, peer_id, msg.get("text", ""))
            elif mtype in HOST_TYPES:
                await _handle_host_command(room, peer_id, msg)
            # boshqa turlar e'tiborsiz
    except WebSocketDisconnect:
        pass
    finally:
        was_host = manager.is_host(room, peer_id)
        manager.remove(room, peer_id)
        await manager.broadcast(
            room, {"type": "peer-left", "peerId": peer_id}, exclude=peer_id
        )
        # Host ketgan bo'lsa — migratsiya.
        if was_host:
            new_host = manager.reassign_host_on_leave(room)
            if new_host:
                await manager.broadcast(
                    room, {"type": "host-changed", "hostPeerId": new_host}
                )


async def _persist_chat(room: str, peer_id: str, text_body: str) -> None:
    if not text_body.strip():
        return
    try:
        async with SessionLocal() as db:
            from app import crud

            meta = manager.meta_of(peer_id)
            await crud.add_chat_message(
                db,
                room_slug=room,
                display_name=manager.name_of(peer_id),
                body=text_body,
                user_id=meta.user_id if meta and meta.user_id else None,
            )
    except Exception:
        pass


# --- Production: qurilgan React SPA'ni ham shu server bersin (ixtiyoriy) ---
# MUHIM: bu mount ENG OXIRIDA — /api va /ws marshrutlaridan keyin.
_here = Path(__file__).resolve().parent
_candidates = [
    Path(os.environ["FRONTEND_DIST"]) if os.environ.get("FRONTEND_DIST") else None,
    _here / "static",
    _here.parent / "frontend" / "dist",
]
_DIST = next((p for p in _candidates if p and p.is_dir()), None)
if _DIST:
    app.mount("/", StaticFiles(directory=str(_DIST), html=True), name="spa")
