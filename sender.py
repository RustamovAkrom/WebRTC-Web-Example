"""
sender.py — WebRTC UZATUVCHI (sender).

Kameradan kadrlarni o'qiydi, har bir kadrga vaqt belgisini (timestamp) qo'shadi
va WebRTC orqali qabul qiluvchiga (reciever.py) jonli uzatadi.

Ishlash mantig'i:
  1. Kameradan oqim beruvchi VideoStreamTrack yaratamiz.
  2. RTCPeerConnection ga shu track'ni qo'shamiz.
  3. Signaling (TCP) serverni ishga tushiramiz — receiver shu yerga ulanadi.
  4. OFFER yaratamiz, yuboramiz va ANSWER ni kutamiz.
  5. Ulanish o'rnatilgach, media to'g'ridan-to'g'ri oqadi.

MUHIM: sender TCP signaling SERVERINI ushlab turadi, shuning uchun uni
RECEIVER'dan OLDIN ishga tushiring. (aiortc'da birinchi `send()` qilgan tomon
server bo'ladi.)

Ishga tushirish (avval shu, keyin reciever.py):
    python sender.py                                   # 0.0.0.0:9999 da tinglaydi
    python sender.py --signaling-host 0.0.0.0          # barcha interfeyslarda
    python sender.py --camera 1                        # boshqa kamera
"""

import argparse
import asyncio
import time

import cv2
import numpy as np
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from aiortc.contrib.signaling import TcpSocketSignaling
from av import VideoFrame


class CameraStreamTrack(VideoStreamTrack):
    """Kamera oqimini WebRTC video track'iga aylantiradi.

    aiortc har safar yangi kadr kerak bo'lganda `recv()` ni chaqiradi.
    Biz OpenCV bilan kameradan kadr o'qiymiz, ustiga vaqtni yozamiz va
    VideoFrame qaytaramiz.
    """

    def __init__(self, camera_id: int = 0):
        super().__init__()  # VideoStreamTrack ni ishga tushirish (muhim!)
        self.cap = cv2.VideoCapture(camera_id)
        if not self.cap.isOpened():
            raise RuntimeError(
                f"Kamera ochilmadi (id={camera_id}). "
                f"Boshqa --camera ID sinab ko'ring (0, 1, 2...)."
            )

    async def recv(self) -> VideoFrame:
        # aiortc uchun kadrning vaqt belgilarini hisoblaymiz.
        pts, time_base = await self.next_timestamp()

        ret, frame = self.cap.read()
        if not ret:
            # Kadr o'qilmasa, qora kadr yuboramiz (oqim uzilmasin).
            frame = np.zeros((480, 640, 3), dtype="uint8")

        # OpenCV BGR formatida o'qiydi — WebRTC uchun RGB ga o'tkazamiz.
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Kadr ustiga joriy vaqtni yozamiz (demo uchun foydali).
        timestamp = time.strftime("%H:%M:%S")
        cv2.putText(
            frame, timestamp, (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2,
        )

        # ndarray -> VideoFrame, vaqt belgilarini o'rnatamiz.
        video_frame = VideoFrame.from_ndarray(frame, format="rgb24")
        video_frame.pts = pts
        video_frame.time_base = time_base
        return video_frame

    def stop(self):
        super().stop()
        if self.cap.isOpened():
            self.cap.release()


async def run(pc: RTCPeerConnection, signaling: TcpSocketSignaling, camera_id: int):
    """Sender mantiqi: track qo'shish, offer yuborish, answer qabul qilish."""

    # Ulanish holatini kuzatamiz (diagnostika uchun).
    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        print(f"[sender] Ulanish holati: {pc.connectionState}")
        if pc.connectionState in ("failed", "closed"):
            await pc.close()

    # 1. Kamera track'ini ulanishga qo'shamiz.
    track = CameraStreamTrack(camera_id)
    pc.addTrack(track)
    print(f"[sender] Kamera (id={camera_id}) qo'shildi.")

    # 2. Signaling: receiver ulanishini kutamiz (sender = server).
    await signaling.connect()
    print("[sender] Signaling tayyor. Receiver ulanishini kutmoqda, OFFER yuboriladi...")

    # 3. OFFER yaratamiz va receiver'ga yuboramiz.
    await pc.setLocalDescription(await pc.createOffer())
    await signaling.send(pc.localDescription)

    # 4. ANSWER ni kutamiz.
    while True:
        obj = await signaling.receive()
        if isinstance(obj, RTCSessionDescription):
            await pc.setRemoteDescription(obj)
            print("[sender] ANSWER qabul qilindi. Media oqmoqda... (to'xtatish: Ctrl+C)")
        elif obj is None:
            print("[sender] Signaling yopildi.")
            break


async def main_async(args):
    signaling = TcpSocketSignaling(args.signaling_host, args.signaling_port)
    pc = RTCPeerConnection()
    try:
        await run(pc, signaling, args.camera)
    finally:
        await pc.close()
        await signaling.close()


def main():
    parser = argparse.ArgumentParser(description="WebRTC kamera uzatuvchi (sender)")
    parser.add_argument("--signaling-host", default="0.0.0.0",
                        help="Tinglash manzili — sender server (standart: 0.0.0.0)")
    parser.add_argument("--signaling-port", type=int, default=9999,
                        help="Signaling porti (standart: 9999)")
    parser.add_argument("--camera", type=int, default=0,
                        help="Kamera ID (standart: 0)")
    args = parser.parse_args()

    try:
        asyncio.run(main_async(args))
    except KeyboardInterrupt:
        print("\n[sender] To'xtatildi.")


if __name__ == "__main__":
    main()
