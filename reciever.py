"""
reciever.py — WebRTC QABUL QILUVCHI (receiver).

Sender'dan (sender.py) kelayotgan video oqimini qabul qiladi va ekranda
real vaqtda ko'rsatadi. Ixtiyoriy ravishda oqimni faylga ham yozadi.

Ishlash mantig'i:
  1. Signaling (TCP) orqali sender serverga ulanamiz (receiver = mijoz).
  2. Sender'dan OFFER ni qabul qilamiz.
  3. ANSWER yaratib qaytaramiz.
  4. "track" hodisasi orqali kelgan kadrlarni oynada ko'rsatamiz.

MUHIM: avval sender.py ishga tushirilgan bo'lishi kerak — u signaling
serverni ushlab turadi, receiver esa unga ulanadi.

Ishga tushirish (sender.py dan KEYIN):
    python reciever.py                              # 127.0.0.1:9999 ga ulanadi
    python reciever.py --signaling-host 192.168.1.10  # sender boshqa kompyuterda
    python reciever.py --record out.mp4             # oqimni faylga ham yozadi

Chiqish: oynada `q` tugmasi yoki terminalda Ctrl+C.
"""

import argparse
import asyncio

import cv2
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaRecorder
from aiortc.contrib.signaling import TcpSocketSignaling


async def display_track(track):
    """Kelayotgan video track'idan kadrlarni o'qib, OpenCV oynasida ko'rsatadi."""
    print("[receiver] Video oqimi keldi — oynada ko'rsatilmoqda. Chiqish: `q`")
    got_first_frame = False
    while True:
        try:
            # Birinchi kadr ICE ulanishi o'rnatilguncha kechikishi mumkin,
            # shuning uchun unga uzoqroq (30s) vaqt beramiz. Keyin oqim
            # uzilishini tezroq (5s) aniqlaymiz.
            timeout = 5.0 if got_first_frame else 30.0
            frame = await asyncio.wait_for(track.recv(), timeout=timeout)
            got_first_frame = True
        except asyncio.TimeoutError:
            msg = "Oqim to'xtadi" if got_first_frame else "Birinchi kadr kelmadi"
            print(f"[receiver] {msg} (timeout).")
            break
        except Exception as exc:  # MediaStreamError va boshqalar
            print(f"[receiver] Oqim tugadi: {exc}")
            break

        # VideoFrame -> ndarray (OpenCV uchun BGR formatida).
        img = frame.to_ndarray(format="bgr24")
        cv2.imshow("WebRTC qabul qilingan oqim", img)

        # `q` bosilsa chiqamiz. waitKey GUI hodisalarini ham qayta ishlaydi.
        if cv2.waitKey(1) & 0xFF == ord("q"):
            print("[receiver] `q` bosildi — to'xtatilmoqda.")
            break

    cv2.destroyAllWindows()


async def run(pc: RTCPeerConnection, signaling: TcpSocketSignaling, record_to: str | None):
    """Receiver mantiqi: offer qabul qilish, answer yuborish, track ko'rsatish."""

    # Ixtiyoriy: kelgan oqimni faylga yozish uchun recorder.
    recorder = MediaRecorder(record_to) if record_to else None

    display_task = None  # ekranga chiqarish vazifasi

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        print(f"[receiver] Ulanish holati: {pc.connectionState}")

    @pc.on("track")
    def on_track(track):
        print(f"[receiver] Track qabul qilindi: kind={track.kind}")
        if track.kind == "video":
            nonlocal display_task
            display_task = asyncio.ensure_future(display_track(track))
        if recorder:
            recorder.addTrack(track)

    # 1. Sender signaling serverga ulanamiz (receiver = mijoz).
    await signaling.connect()
    print("[receiver] Sender'ga ulanildi. OFFER kutilmoqda...")

    # 2. Asosiy signaling tsikli: OFFER qabul qilib, ANSWER qaytaramiz.
    while True:
        obj = await signaling.receive()

        if isinstance(obj, RTCSessionDescription):
            await pc.setRemoteDescription(obj)
            print("[receiver] OFFER qabul qilindi. ANSWER yuborilmoqda...")

            if recorder:
                await recorder.start()

            await pc.setLocalDescription(await pc.createAnswer())
            await signaling.send(pc.localDescription)

        elif obj is None:
            print("[receiver] Signaling yopildi.")
            break

    # Ekranga chiqarish tugashini kutamiz.
    if display_task:
        await display_task
    if recorder:
        await recorder.stop()


async def main_async(args):
    signaling = TcpSocketSignaling(args.signaling_host, args.signaling_port)
    pc = RTCPeerConnection()
    try:
        await run(pc, signaling, args.record)
    finally:
        await pc.close()
        await signaling.close()
        cv2.destroyAllWindows()


def main():
    parser = argparse.ArgumentParser(description="WebRTC oqim qabul qiluvchi (receiver)")
    parser.add_argument("--signaling-host", default="127.0.0.1",
                        help="Sender IP manzili — unga ulanadi (standart: 127.0.0.1)")
    parser.add_argument("--signaling-port", type=int, default=9999,
                        help="Signaling porti (standart: 9999)")
    parser.add_argument("--record", default=None, metavar="FAYL",
                        help="Kelgan oqimni shu faylga yozish (masalan: out.mp4)")
    args = parser.parse_args()

    try:
        asyncio.run(main_async(args))
    except KeyboardInterrupt:
        print("\n[receiver] To'xtatildi.")


if __name__ == "__main__":
    main()
