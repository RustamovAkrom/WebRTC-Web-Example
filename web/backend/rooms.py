"""
rooms.py — xona (room) va peer'larni boshqaruvchi RoomManager.

Backend SIGNALING server: WebRTC SDP (offer/answer) va ICE candidate'larni bir
xonadagi peer'lar orasida uzatadi (relay). Media oqimi peer'lar orasida
to'g'ridan-to'g'ri (P2P) boradi.

Bundan tashqari RoomManager HOST/MODERATOR holatini ham saqlaydi (server = yagona
avtoritet): kim host, xona egasi (DB'dan), spotlight nishoni, lock holati va har
peer'ning meta ma'lumoti (user_id, forced_mute).
"""

from __future__ import annotations

import itertools
from typing import Any, Dict, Iterable, Optional

from fastapi import WebSocket


class PeerMeta:
    __slots__ = ("user_id", "is_auth", "forced_muted")

    def __init__(self, user_id: str | None, is_auth: bool) -> None:
        self.user_id = user_id
        self.is_auth = is_auth
        self.forced_muted = False


class RoomManager:
    """Faol WebSocket ulanishlarini xonalar bo'yicha saqlaydi va xabar uzatadi."""

    def __init__(self) -> None:
        # room_id -> { peer_id -> WebSocket }  (insertion order = qo'shilish tartibi)
        self._rooms: Dict[str, Dict[str, WebSocket]] = {}
        self._names: Dict[str, str] = {}
        self._meta: Dict[str, PeerMeta] = {}
        self._counter = itertools.count(1)

        # --- Host / moderator holati ---
        self._hosts: Dict[str, str] = {}              # room -> host peer_id
        self._owners: Dict[str, Optional[str]] = {}   # room -> egasi user_id (DB)
        self._owner_loaded: set[str] = set()          # DB'dan tekshirilgan room'lar
        self._spotlight: Dict[str, Optional[str]] = {}  # room -> spotlight peer_id
        self._locked: Dict[str, bool] = {}            # room -> qulflanganmi

    # --- Peer hayot tsikli ---

    def new_peer_id(self) -> str:
        return f"peer-{next(self._counter)}"

    async def add(
        self,
        room: str,
        peer_id: str,
        name: str,
        ws: WebSocket,
        user_id: str | None = None,
        is_auth: bool = False,
    ) -> None:
        self._rooms.setdefault(room, {})[peer_id] = ws
        self._names[peer_id] = name
        self._meta[peer_id] = PeerMeta(user_id, is_auth)

    def remove(self, room: str, peer_id: str) -> None:
        peers = self._rooms.get(room)
        if peers:
            peers.pop(peer_id, None)
            if not peers:  # xona bo'shab qolsa, hamma holatni tozalaymiz
                self._rooms.pop(room, None)
                self._hosts.pop(room, None)
                self._owners.pop(room, None)
                self._owner_loaded.discard(room)
                self._spotlight.pop(room, None)
                self._locked.pop(room, None)
        self._names.pop(peer_id, None)
        self._meta.pop(peer_id, None)

    def name_of(self, peer_id: str) -> str:
        return self._names.get(peer_id, peer_id)

    def meta_of(self, peer_id: str) -> PeerMeta | None:
        return self._meta.get(peer_id)

    def peers(self, room: str, exclude: str | None = None) -> Iterable[str]:
        """Xonadagi peer ID'lar (qo'shilish tartibida, ixtiyoriy bittasini chiqarib)."""
        return [pid for pid in self._rooms.get(room, {}) if pid != exclude]

    def has_peer(self, room: str, peer_id: str) -> bool:
        return peer_id in self._rooms.get(room, {})

    # --- Egalik (DB'dan lazy yuklanadi) ---

    def owner_loaded(self, room: str) -> bool:
        return room in self._owner_loaded

    def set_owner(self, room: str, owner_user_id: str | None) -> None:
        self._owners[room] = owner_user_id
        self._owner_loaded.add(room)

    def owner_of(self, room: str) -> str | None:
        return self._owners.get(room)

    # --- Host ---

    def host_of(self, room: str) -> str | None:
        return self._hosts.get(room)

    def is_host(self, room: str, peer_id: str) -> bool:
        return self._hosts.get(room) == peer_id

    def assign_host_on_join(self, room: str, peer_id: str) -> str | None:
        """
        Qo'shilgandan keyin host kim bo'lishini hal qiladi.
        Qaytaradi: agar host O'ZGARGAN bo'lsa yangi host peer_id, aks holda None.

        Qoidalar:
          - Host hali yo'q  → bu peer host bo'ladi.
          - Egali xona + bu peer egasining o'zi + hozirgi host egasi emas
            → host shu peer'ga o'tadi (transfer).
        """
        current = self._hosts.get(room)
        if current is None:
            self._hosts[room] = peer_id
            return peer_id

        owner = self._owners.get(room)
        meta = self._meta.get(peer_id)
        if owner and meta and meta.user_id == owner:
            cur_meta = self._meta.get(current)
            if not (cur_meta and cur_meta.user_id == owner):
                self._hosts[room] = peer_id
                return peer_id
        return None

    def reassign_host_on_leave(self, room: str) -> str | None:
        """
        Host ketgandan KEYIN (remove'dan keyin) chaqiriladi. Yangi host tanlaydi:
        egasi hozir bo'lsa — egasining peer'i, aks holda eng eski qolgan peer.
        Qaytaradi: yangi host peer_id yoki None (xona bo'sh).
        """
        members = list(self._rooms.get(room, {}).keys())
        if not members:
            self._hosts.pop(room, None)
            return None

        owner = self._owners.get(room)
        if owner:
            for pid in members:
                meta = self._meta.get(pid)
                if meta and meta.user_id == owner:
                    self._hosts[room] = pid
                    return pid
        new_host = members[0]
        self._hosts[room] = new_host
        return new_host

    def set_host(self, room: str, peer_id: str) -> None:
        self._hosts[room] = peer_id

    # --- Spotlight ---

    def set_spotlight(self, room: str, peer_id: str | None) -> None:
        self._spotlight[room] = peer_id

    def spotlight_of(self, room: str) -> str | None:
        return self._spotlight.get(room)

    # --- Lock ---

    def set_locked(self, room: str, locked: bool) -> None:
        self._locked[room] = locked

    def is_locked(self, room: str) -> bool:
        return self._locked.get(room, False)

    # --- Forced mute ---

    def set_forced_mute(self, peer_id: str, value: bool) -> None:
        meta = self._meta.get(peer_id)
        if meta:
            meta.forced_muted = value

    # --- Xabar uzatish ---

    async def send_to(self, room: str, peer_id: str, message: dict[str, Any]) -> None:
        ws = self._rooms.get(room, {}).get(peer_id)
        if ws is not None:
            await ws.send_json(message)

    async def broadcast(
        self, room: str, message: dict[str, Any], exclude: str | None = None
    ) -> None:
        for pid, ws in list(self._rooms.get(room, {}).items()):
            if pid == exclude:
                continue
            await ws.send_json(message)

    def socket_of(self, room: str, peer_id: str) -> WebSocket | None:
        return self._rooms.get(room, {}).get(peer_id)
