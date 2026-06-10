# 04 — Media oqimlari va Data Channel

WebRTC ikki xil ma'lumotni uzata oladi:

1. **Media** — audio va video oqimlari (kamera, mikrofon, ekran)
2. **Data** — ixtiyoriy ikkilik/matn ma'lumot (chat, fayl, o'yin holati)

## 1. Media oqimlari (tracks)

WebRTC'da har bir audio yoki video manba alohida **track** (yo'lak) sifatida ifodalanadi.
Tracks `RTCPeerConnection` ga qo'shiladi va avtomatik ravishda boshqa tomonga oqadi.

### aiortc'da media track

`aiortc` da media uzatish uchun `VideoStreamTrack` (yoki `AudioStreamTrack`) klassidan
meros olinadi va `recv()` metodi yoziladi — u har safar bitta **kadr (frame)** qaytaradi:

```python
from aiortc import VideoStreamTrack
from av import VideoFrame
import cv2, fractions

class CameraStreamTrack(VideoStreamTrack):
    def __init__(self, camera_id=0):
        super().__init__()
        self.cap = cv2.VideoCapture(camera_id)

    async def recv(self):
        # WebRTC vaqt belgilarini (timestamp) hisoblaydi
        pts, time_base = await self.next_timestamp()

        ret, frame = self.cap.read()              # OpenCV bilan kadr olish (BGR)
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        video_frame = VideoFrame.from_ndarray(frame, format="rgb24")
        video_frame.pts = pts
        video_frame.time_base = time_base
        return video_frame
```

### Qabul qilish tomonida

Receiver `@pc.on("track")` hodisasi orqali kelayotgan track'ni "tutadi" va
kadrlarni `track.recv()` bilan o'qiydi:

```python
@pc.on("track")
def on_track(track):
    async def read_frames():
        while True:
            frame = await track.recv()
            img = frame.to_ndarray(format="bgr24")   # OpenCV uchun BGR
            cv2.imshow("WebRTC", img)
            cv2.waitKey(1)
    asyncio.ensure_future(read_frames())
```

### Kodeklar

WebRTC media uchun standart kodeklardan foydalanadi:

| Tur | Kodeklar |
|-----|----------|
| Video | **VP8**, VP9, **H.264**, AV1 |
| Audio | **Opus**, G.711 |

`aiortc` siz uchun kodlash/dekodlashni avtomatik bajaradi — siz faqat xom kadrlar
(`VideoFrame`) bilan ishlaysiz.

## 2. Data Channel (`RTCDataChannel`)

Media'dan tashqari, WebRTC ixtiyoriy ma'lumot uzatish uchun **data channel** beradi.
Bu **WebSocket'ga o'xshaydi**, lekin **peer-to-peer** va past kechikishli.

```python
# Sender tomonida kanal ochish
channel = pc.createDataChannel("chat")

@channel.on("open")
def on_open():
    channel.send("Salom! Bu data channel orqali keldi.")

# Receiver tomonida
@pc.on("datachannel")
def on_datachannel(channel):
    @channel.on("message")
    def on_message(message):
        print("Xabar keldi:", message)
```

### Data channel rejimlari

| Rejim | Tavsif | Misol |
|-------|--------|-------|
| **Reliable + ordered** | TCP kabi — yo'qotmaydi, tartibni saqlaydi (standart) | Chat, fayl |
| **Unreliable / unordered** | UDP kabi — tez, lekin yo'qotishi mumkin | O'yin pozitsiyasi |

## Qachon nima?

```
Audio/video kerakmi?      → Media track
Matn/fayl/holat kerakmi?  → Data channel
Ikkalasi ham?             → Bitta RTCPeerConnection da ikkalasi birga ishlaydi ✅
```

Keyingi: [05 — Python aiortc](./05-python-aiortc.md).
