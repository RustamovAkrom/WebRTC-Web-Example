# 05 — Python'da WebRTC: aiortc

## aiortc nima?

**aiortc** — bu Python uchun WebRTC va ORTC ning toza implementatsiyasi. U Python'ning
`asyncio` (asinxron) kutubxonasi ustiga qurilgan.

Brauzersiz, server tomonida yoki IoT qurilmalarida WebRTC ishlatmoqchi bo'lsangiz —
`aiortc` aynan shu uchun.

```bash
pip install aiortc opencv-python
```

> `aiortc` ichida media kodlash uchun **PyAV** (`av`) va shifrlash uchun kerakli
> kutubxonalar avtomatik o'rnatiladi.

## Asosiy klasslar

| Klass / modul | Vazifasi |
|---------------|----------|
| `RTCPeerConnection` | Ulanishni boshqaradi (eng muhimi) |
| `VideoStreamTrack` / `AudioStreamTrack` | Media manbasini ifodalaydi |
| `MediaStreamTrack.recv()` | Bitta kadrni qaytaradi |
| `RTCSessionDescription` | SDP (offer/answer) |
| `RTCIceCandidate` | ICE nomzodi |
| `aiortc.contrib.signaling` | Tayyor signaling yordamchilari (demo uchun) |
| `aiortc.contrib.media` | `MediaPlayer`, `MediaRecorder` (fayl/qurilma bilan) |

## asyncio asoslari

`aiortc` butunlay asinxron, shuning uchun kod `async`/`await` bilan yoziladi:

```python
import asyncio
from aiortc import RTCPeerConnection

async def main():
    pc = RTCPeerConnection()
    # ... ulanish mantig'i ...
    await some_signaling_step()

if __name__ == "__main__":
    asyncio.run(main())
```

## Tipik ulanish hayot sikli

```python
pc = RTCPeerConnection()

# 1. Hodisalarni kuzatish
@pc.on("connectionstatechange")
async def on_state_change():
    print("Holat:", pc.connectionState)   # new → connecting → connected → ...
    if pc.connectionState == "failed":
        await pc.close()

# 2. (Sender) track qo'shish
pc.addTrack(CameraStreamTrack())

# 3. Offer/answer almashinuvi (signaling orqali) — qarang 03-signaling.md

# 4. Ish tugagach tozalash
await pc.close()
```

## STUN/TURN sozlash

Internet orqali (turli tarmoqlardagi) ulanish uchun ICE serverlarini ko'rsating:

```python
from aiortc import RTCPeerConnection, RTCConfiguration, RTCIceServer

config = RTCConfiguration(iceServers=[
    RTCIceServer(urls="stun:stun.l.google.com:19302"),
    # TURN kerak bo'lsa:
    # RTCIceServer(urls="turn:turn.example.com:3478",
    #              username="user", credential="pass"),
])

pc = RTCPeerConnection(configuration=config)
```

> Bir xil mahalliy tarmoqda (LAN) sinab ko'rayotgan bo'lsangiz, STUN shart emas.

## Foydali yordamchilar

### MediaPlayer — fayl yoki qurilmadan o'qish

```python
from aiortc.contrib.media import MediaPlayer

player = MediaPlayer("video.mp4")          # fayldan
# player = MediaPlayer("/dev/video0")      # Linux kamera
pc.addTrack(player.video)
```

### MediaRecorder — kelgan oqimni faylga yozish

```python
from aiortc.contrib.media import MediaRecorder

recorder = MediaRecorder("output.mp4")
@pc.on("track")
async def on_track(track):
    recorder.addTrack(track)
    await recorder.start()
```

## Tez-tez uchraydigan muammolar

| Muammo | Yechim |
|--------|--------|
| `cv2.VideoCapture` bo'sh kadr qaytaradi | Kamera ID (`0`, `1`) to'g'rimi tekshiring |
| Ulanish `failed` bo'ladi | STUN/TURN sozlang yoki bir xil LAN'da sinang |
| Kadr ranglari noto'g'ri | BGR ↔ RGB konvertatsiyani tekshiring |
| `av` o'rnatilmaydi | Python versiyasi (3.8+) va `pip` ni yangilang |

Keyingi: [06 — Loyiha qo'llanma](./06-loyiha-qollanma.md) — kodni ishga tushirish.
