"""
main.py — WebRTC video chat SIGNALING serveri (FastAPI).

Vazifasi:
  - `/ws/{room}` WebSocket endpoint orqali bir xonadagi brauzerlar o'rtasida
    WebRTC offer/answer/ICE xabarlarini uzatish (relay).
  - `/health` — holat tekshiruvi.
  - Production'da (agar `frontend/dist` mavjud bo'lsa) qurilgan React SPA'ni ham
    shu server beradi — bitta konteyner varianti uchun.

Media oqimi BRAUZERLAR orasida to'g'ridan-to'g'ri (P2P) boradi; bu server faqat
"tanishtiruvchi" rolini bajaradi.

Ishga tushirish:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from rooms import RoomManager

app = FastAPI(title="WebRTC Video Chat Signaling")

# Dev'da Vite boshqa portda ishlaydi — CORS'ni ochamiz.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = RoomManager()

# Relay qilinadigan xabar turlari (faqat shular boshqa peer'ga uzatiladi).
RELAY_TYPES = {"offer", "answer", "ice"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.websocket("/ws/{room}")
async def signaling(websocket: WebSocket, room: str) -> None:
    """Bitta brauzer ulanishi uchun signaling tsikli."""
    await websocket.accept()

    # Ism query-paramdan olinadi: /ws/myroom?name=Ali
    name = websocket.query_params.get("name", "Anon")
    peer_id = manager.new_peer_id()
    await manager.add(room, peer_id, name, websocket)

    # 1. Yangi peer'ga o'z ID'sini va xonadagi mavjud peer'lar ro'yxatini yuboramiz.
    existing = [
        {"peerId": pid, "name": manager.name_of(pid)}
        for pid in manager.peers(room, exclude=peer_id)
    ]
    await websocket.send_json(
        {"type": "welcome", "peerId": peer_id, "peers": existing}
    )

    # 2. Xonadagi boshqalarga yangi peer qo'shilganini bildiramiz.
    await manager.broadcast(
        room,
        {"type": "peer-joined", "peerId": peer_id, "name": name},
        exclude=peer_id,
    )

    try:
        # 3. Asosiy tsikl: offer/answer/ice xabarlarini manzil peer'ga uzatamiz.
        while True:
            msg = await websocket.receive_json()
            mtype = msg.get("type")
            target = msg.get("to")

            if mtype in RELAY_TYPES and target:
                # "from" maydonini server o'zi qo'yadi (ishonchli manba).
                msg["from"] = peer_id
                await manager.send_to(room, target, msg)
            # boshqa turdagi xabarlar e'tiborsiz qoldiriladi
    except WebSocketDisconnect:
        pass
    finally:
        # 4. Ulanish uzilganda: ro'yxatdan o'chirib, boshqalarga xabar beramiz.
        manager.remove(room, peer_id)
        await manager.broadcast(
            room, {"type": "peer-left", "peerId": peer_id}, exclude=peer_id
        )


# --- Production: qurilgan React SPA'ni ham shu server bersin (ixtiyoriy) ---
# Qurilgan UI'ni bir nechta joydan qidiramiz:
#   1. FRONTEND_DIST muhit o'zgaruvchisi (Docker'da o'rnatamiz)
#   2. backend yonidagi `static/` (bitta-konteyner deploy)
#   3. dev'dagi `../frontend/dist` (npm run build dan keyin)
_here = Path(__file__).resolve().parent
_candidates = [
    Path(os.environ["FRONTEND_DIST"]) if os.environ.get("FRONTEND_DIST") else None,
    _here / "static",
    _here.parent / "frontend" / "dist",
]
_DIST = next((p for p in _candidates if p and p.is_dir()), None)
if _DIST:
    # html=True → SPA marshrutlari uchun index.html qaytaradi.
    app.mount("/", StaticFiles(directory=str(_DIST), html=True), name="spa")
