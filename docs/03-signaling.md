# 03 — Signaling: SDP va offer/answer

## Signaling nima?

**Signaling** — bu ikkita tugun (peer) ulanishdan **oldin** o'zaro kerakli ma'lumotlarni
almashish jarayoni. WebRTC standarti signaling'ni qanday qilishni **belgilamaydi** —
bu sizning ixtiyoringizda. Ya'ni:

> WebRTC sizga media oqimini beradi, lekin "ikki tugun bir-birini qanday topadi?"
> degan savolni o'zingiz hal qilasiz.

Signaling uchun istalgan kanaldan foydalanish mumkin:

- **WebSocket** (eng keng tarqalgan, brauzer ilovalari uchun)
- **TCP socket** (bizning Python misolimizda — soddaligi uchun)
- HTTP / REST
- Hatto QR-kod yoki qo'lda nusxa-joylash ham!

## Nimani almashadi?

Signaling orqali ikki narsa uzatiladi:

### 1. SDP (Session Description Protocol)

**SDP** — bu tugunning "tashrif qog'ozi": u qanday media (audio/video), qaysi kodeklar
(VP8, H.264, Opus...), qaysi formatlarni qo'llab-quvvatlashini ta'riflaydi.

### 2. ICE candidate'lar

[02 — Arxitektura](./02-arxitektura.md) da tushuntirilgan ulanish yo'llari.

## Offer / Answer modeli

WebRTC ulanishi **so'rov-javob (offer/answer)** modeli asosida quriladi:

```
   Peer A (sender)                          Peer B (receiver)
        │                                          │
        │  1. createOffer()                        │
        │     setLocalDescription(offer)           │
        │                                          │
        │  ──────── OFFER (SDP) ──────────────────▶│
        │            (signaling orqali)            │
        │                                          │ 2. setRemoteDescription(offer)
        │                                          │    createAnswer()
        │                                          │    setLocalDescription(answer)
        │                                          │
        │◀──────── ANSWER (SDP) ───────────────────│
        │                                          │
        │  3. setRemoteDescription(answer)         │
        │                                          │
        │  ◀═══ ICE candidate'lar almashinadi ═══▶ │
        │                                          │
        │  ✅ Ulanish o'rnatildi — media oqadi     │
        ▼                                          ▼
```

### Qadamlar tushuntirilgan

1. **Sender (A)** `offer` yaratadi va uni o'zining "local description" sifatida
   o'rnatadi, so'ng signaling orqali B'ga yuboradi.
2. **Receiver (B)** offer'ni "remote description" qilib qabul qiladi, javob (`answer`)
   yaratadi va A'ga qaytaradi.
3. **A** answer'ni qabul qiladi. Endi ikkalasi bir-birini "tushunadi".
4. Parallel ravishda **ICE candidate'lar** almashinadi va eng yaxshi yo'l tanlanadi.

## Bizning Python loyihamizda

Biz `aiortc.contrib.signaling.TcpSocketSignaling` dan foydalanamiz — bu oddiy TCP
socket orqali SDP'ni almashtiruvchi tayyor yordamchi. Bu **o'qitish/demo** uchun ideal,
chunki alohida signaling server yozish shart emas.

```python
from aiortc.contrib.signaling import TcpSocketSignaling

signaling = TcpSocketSignaling("0.0.0.0", 9999)   # server tomon
# yoki
signaling = TcpSocketSignaling("192.168.1.10", 9999)  # mijoz tomon

await signaling.connect()
await signaling.send(pc.localDescription)   # offer/answer yuborish
obj = await signaling.receive()             # qabul qilish
```

> ⚠️ **Production eslatmasi:** `TcpSocketSignaling` faqat ikki tugun va o'qitish uchun.
> Haqiqiy ilovada WebSocket asosidagi signaling server (masalan FastAPI + WebSocket)
> ishlatiladi, bu bir nechta foydalanuvchi va xona (room) mantiqini qo'llab-quvvatlaydi.

Keyingi: [04 — Media va Data Channel](./04-media-va-datachannel.md).
