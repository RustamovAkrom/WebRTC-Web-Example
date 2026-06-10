# 07 — Full-stack web ilova: arxitektura

Bu hujjat `web/` papkasidagi brauzer asosidagi **video chat** ilovasining ishlash
prinsipini tushuntiradi. Desktop demo (`sender.py`/`reciever.py`) `aiortc` ni
ko'rsatadi; bu yerda esa **brauzerlarning o'z WebRTC**'sidan foydalanamiz.

## Umumiy rasm

```
  [Brauzer A] ◀──────── MEDIA (P2P) ────────▶ [Brauzer B]
       │                                            │
       │  offer/answer/ICE (WebSocket)              │
       └──────────▶  FastAPI signaling  ◀───────────┘
                     (faqat xabar uzatadi)
```

Asosiy g'oya: **media serverdan o'tmaydi**. Server faqat ikki brauzerni
"tanishtiradi" (signaling), keyin video/audio to'g'ridan-to'g'ri oqadi.

> Nega `aiortc` yo'q? Chunki media'ni brauzerlar o'zi kodlaydi/uzatadi. `aiortc`
> faqat **server media bilan ishlaganda** (yozib olish, SFU, server kamera) kerak.

## Komponentlar

| Qatlam | Texnologiya | Vazifa |
|--------|-------------|--------|
| Backend | FastAPI + WebSocket | Signaling relay, xona boshqaruvi |
| Frontend | React + Vite | UI + brauzer WebRTC mantiqi |
| Media | Brauzer WebRTC | P2P audio/video |

## Signaling protokoli (WebSocket, JSON)

Ulanish: `ws://host/ws/{room}?name=Ism`

| `type` | Yo'nalish | Maydonlar | Ma'no |
|--------|-----------|-----------|-------|
| `welcome` | server → siz | `peerId`, `peers[]` | sizning ID + xonadagi mavjudlar |
| `peer-joined` | server → barcha | `peerId`, `name` | yangi ishtirokchi keldi |
| `peer-left` | server → barcha | `peerId` | ishtirokchi chiqdi |
| `offer` | peer → peer | `to`, `from`, `name`, `sdp` | ulanish taklifi |
| `answer` | peer → peer | `to`, `from`, `name`, `sdp` | javob |
| `ice` | peer → peer | `to`, `from`, `candidate` | ulanish yo'li nomzodi |

Server `offer`/`answer`/`ice` xabarlaridagi `to` maydoniga qarab ularni kerakli
peer'ga uzatadi va `from` ni ishonchli tarzda o'zi qo'yadi.

## Mesh negotiation (glare'siz)

Bir nechta ishtirokchi bo'lganda har bir juftlik uchun alohida `RTCPeerConnection`
ochiladi. "Kim offer yuboradi?" muammosini oddiy qoida hal qiladi:

```
Yangi kirgan peer  ──offer──▶  xonadagi mavjud har bir peer
Mavjud peer        ──answer─▶  yangi kirgan peer
```

Ya'ni **faqat yangi kelgan tashabbuskor** — shu sabab ikki tomon bir vaqtda offer
yuborib qolmaydi (glare oldini oladi). Kodda: `useWebRTC.js` → `welcome` hodisasida
`createPeer(..., isInitiator=true)`, `offer` hodisasida `isInitiator=false`.

## Frontend yadrosi — `useWebRTC.js`

Mas'uliyatlari:
1. `getUserMedia` — kamera + mikrofon.
2. Har bir remote peer uchun `RTCPeerConnection` (Map).
3. Signaling hodisalarini qayta ishlash (offer/answer/ice).
4. `ontrack` → remote stream'ni UI holatiga yozish.
5. Boshqaruvlar: `toggleMic`, `toggleCam`, `shareScreen`
   (`getDisplayMedia` + `sender.replaceTrack`), `leave`.

ICE candidate remote description'dan oldin kelsa — buferlanadi va keyin qo'llanadi.

## Deploy va cheklovlar

- **HTTPS:** media API'lari faqat xavfsiz kontekstda (localhost/HTTPS) ishlaydi.
- **STUN/TURN:** STUN kiritilgan; qattiq NAT uchun TURN qo'shiladi (`ICE_SERVERS`).
- **Mesh cheklovi:** N ishtirokchi uchun har kim N−1 ulanish ushlaydi → 2–4 kishi
  uchun mos. Kattaroq konferensiya uchun **SFU** kerak.

Amaliy ishga tushirish: [../web/README.md](../web/README.md).
