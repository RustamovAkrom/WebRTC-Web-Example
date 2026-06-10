# 🎥 WebRTC Python — jonli kamera oqimi (real loyiha)

`aiortc` yordamida bitta mashinadagi kamerani **WebRTC orqali peer-to-peer** boshqa
mashinaga jonli uzatuvchi minimal, lekin to'liq ishlaydigan loyiha. Hujjatlar o'zbek
tilida, mavzularga ajratilgan.

> **WebRTC** — brauzerlar va ilovalar o'rtasida real vaqtda audio/video/ma'lumotni
> to'g'ridan-to'g'ri uzatish texnologiyasi. Batafsil: [docs/01-webrtc-nima.md](docs/01-webrtc-nima.md).

---

## ⚡ Tez boshlash (Quickstart)

```powershell
# 1. Kutubxonalarni o'rnatish
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 2. Ikkita terminalda ishga tushirish (bir xil kompyuterda)
#    Terminal 1 — uzatuvchi (AVVAL, u signaling server):
python sender.py

#    Terminal 2 — qabul qiluvchi:
python reciever.py
```

Receiver oynasida jonli video ko'rinadi. Chiqish — oynada **`q`** tugmasi.

> ℹ️ **Tartib muhim:** `sender.py` TCP signaling serverni ushlab turadi, shuning uchun
> **uni birinchi** ishga tushiring; `reciever.py` esa unga ulanadi.

Ikki alohida kompyuter uchun: [docs/06-loyiha-qollanma.md](docs/06-loyiha-qollanma.md).

---

## 📁 Loyiha tuzilmasi

```
WebRTC/
├── docs/                       ← o'quv hujjatlari (o'zbekcha)
│   ├── 01-webrtc-nima.md       ← WebRTC nima va nega kerak
│   ├── 02-arxitektura.md       ← NAT, STUN, TURN, ICE
│   ├── 03-signaling.md         ← SDP va offer/answer
│   ├── 04-media-va-datachannel.md ← media tracks va data channel
│   ├── 05-python-aiortc.md     ← aiortc kutubxonasi
│   └── 06-loyiha-qollanma.md   ← ishga tushirish bo'yicha qo'llanma
├── sender.py                   ← kamerani o'qib UZATADI
├── reciever.py                 ← oqimni QABUL qilib ko'rsatadi
├── requirements.txt
└── README.md
```

---

## 🧠 WebRTC qanday ishlaydi (qisqacha)

```
              ┌─────────────────┐
              │  Signaling      │  ← SDP/ICE almashinadi (faqat ulanish boshida)
              └────────┬────────┘
        ┌──────────────┴──────────────┐
        ▼                              ▼
   ┌──────────┐    STUN/TURN     ┌──────────┐
   │ sender   │═════ MEDIA ═════▶│ reciever │
   │ (kamera) │  (to'g'ridan-    │ (ekran)  │
   └──────────┘   to'g'ri P2P)    └──────────┘
```

1. **Signaling** — ikki tugun bir-birini "tanishtiradi" (offer → answer).
2. **ICE/STUN/TURN** — eng yaxshi ulanish yo'li tanlanadi.
3. **Media** — kamera kadrlari to'g'ridan-to'g'ri oqadi (server orqali emas).

Batafsil tushuntirish uchun `docs/` ni tartib bilan o'qing.

---

## 🌐 Web ilova (full-stack video chat)

Desktop demodan tashqari, `web/` papkasida **brauzerda ishlaydigan ikki tomonlama
video chat** bor (FastAPI signaling + React/Vite). Foydalanuvchilar bir xona ID bilan
kirib, bir-birini kamera/mikrofon orqali ko'radi va ekran ulasha oladi.

```powershell
# Backend
cd web/backend && pip install -r requirements.txt && uvicorn main:app --port 8000 --reload
# Frontend (boshqa terminal)
cd web/frontend && npm install && npm run dev      # http://localhost:5173
# yoki Docker bilan:
cd web && docker compose up --build                # http://localhost:8080
```

Batafsil: [web/README.md](web/README.md) va [docs/07-web-fullstack.md](docs/07-web-fullstack.md).

---

## 📚 Hujjatlarni o'qish tartibi

| # | Mavzu | Fayl |
|---|-------|------|
| 1 | WebRTC nima? | [01-webrtc-nima.md](docs/01-webrtc-nima.md) |
| 2 | Arxitektura (NAT/STUN/TURN/ICE) | [02-arxitektura.md](docs/02-arxitektura.md) |
| 3 | Signaling (SDP, offer/answer) | [03-signaling.md](docs/03-signaling.md) |
| 4 | Media va Data Channel | [04-media-va-datachannel.md](docs/04-media-va-datachannel.md) |
| 5 | Python — aiortc | [05-python-aiortc.md](docs/05-python-aiortc.md) |
| 6 | Loyihani ishga tushirish | [06-loyiha-qollanma.md](docs/06-loyiha-qollanma.md) |
| 7 | Full-stack web ilova arxitekturasi | [07-web-fullstack.md](docs/07-web-fullstack.md) |

---

## 🛠 Texnologiyalar

- **Python 3.8+**
- [**aiortc**](https://github.com/aiortc/aiortc) — Python WebRTC implementatsiyasi
- [**OpenCV**](https://opencv.org/) (`opencv-python`) — kamera va ekran
- **asyncio** — asinxron ish

---

## 📖 Manbalar

- [aiortc rasmiy hujjatlari](https://aiortc.readthedocs.io/)
- [WebRTC.org](https://webrtc.org/)
- [MDN — WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- Building a Real-Time Streaming Application using WebRTC in Python — Medium maqolasi

---

## ⚠️ Eslatma

Bu loyiha **o'qitish va demo** uchun. Production'da TCP signaling o'rniga WebSocket
signaling server, STUN/TURN sozlamalari va xavfsizlik choralari kerak bo'ladi —
qarang [docs/06-loyiha-qollanma.md](docs/06-loyiha-qollanma.md) ning oxiri.
