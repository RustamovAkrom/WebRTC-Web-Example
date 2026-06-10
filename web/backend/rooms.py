"""
rooms.py — xona (room) va peer'larni boshqaruvchi RoomManager.

Backend faqat SIGNALING server: u WebRTC SDP (offer/answer) va ICE candidate'larni
bir xonadagi peer'lar orasida uzatadi (relay). Media oqimi peer'lar orasida
to'g'ridan-to'g'ri (P2P) boradi — bu yerga kelmaydi.
"""

from __future__ import annotations

import itertools
from typing import Any, Dict, Iterable

from fastapi import WebSocket


class RoomManager:
    """Faol WebSocket ulanishlarini xonalar bo'yicha saqlaydi va xabar uzatadi."""

    def __init__(self) -> None:
        # room_id -> { peer_id -> WebSocket }
        self._rooms: Dict[str, Dict[str, WebSocket]] = {}
        # peer_id -> ko'rsatiladigan ism
        self._names: Dict[str, str] = {}
        # deterministik, oddiy peer ID generatori (uuid o'rniga)
        self._counter = itertools.count(1)

    def new_peer_id(self) -> str:
        return f"peer-{next(self._counter)}"

    async def add(self, room: str, peer_id: str, name: str, ws: WebSocket) -> None:
        self._rooms.setdefault(room, {})[peer_id] = ws
        self._names[peer_id] = name

    def remove(self, room: str, peer_id: str) -> None:
        peers = self._rooms.get(room)
        if peers:
            peers.pop(peer_id, None)
            if not peers:  # xona bo'shab qolsa, o'chiramiz
                self._rooms.pop(room, None)
        self._names.pop(peer_id, None)

    def name_of(self, peer_id: str) -> str:
        return self._names.get(peer_id, peer_id)

    def peers(self, room: str, exclude: str | None = None) -> Iterable[str]:
        """Xonadagi peer ID'lar (ixtiyoriy ravishda bittasini chiqarib tashlab)."""
        return [pid for pid in self._rooms.get(room, {}) if pid != exclude]

    async def send_to(self, room: str, peer_id: str, message: dict[str, Any]) -> None:
        """Bitta peer'ga xabar yuborish (masalan, unga atalgan offer/answer/ice)."""
        ws = self._rooms.get(room, {}).get(peer_id)
        if ws is not None:
            await ws.send_json(message)

    async def broadcast(
        self, room: str, message: dict[str, Any], exclude: str | None = None
    ) -> None:
        """Xonadagi barchaga (exclude'dan tashqari) xabar yuborish."""
        for pid, ws in list(self._rooms.get(room, {}).items()):
            if pid == exclude:
                continue
            await ws.send_json(message)
