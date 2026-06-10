# 🎥 WebRTC Video Chat — full-stack web ilova

Brauzerda ishlaydigan **ikki tomonlama (mesh) video chat**: foydalanuvchilar bir xona
ID bilan kirib, bir-birini kamera + mikrofon orqali real vaqtda ko'radi, ekranni
ulasha oladi.

- **Backend:** FastAPI — faqat **WebSocket signaling** (SDP/ICE uzatadi).
- **Frontend:** React + Vite.
- **Media:** brauzerlar orasida to'g'ridan-to'g'ri **P2P** (server orqali o'tmaydi).

> Arxitektura va signaling protokoli batafsil: [../docs/07-web-fullstack.md](../docs/07-web-fullstack.md).

---

## ⚡ Ishga tushirish (dev rejimi)

Ikkita terminal:

**Terminal 1 — backend:**
```powershell
cd web/backend
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```

**Terminal 2 — frontend:**
```powershell
cd web/frontend
npm install
npm run dev
```

Brauzerda **http://localhost:5173** ni oching. Sinash uchun **ikkita oyna/tab**da bir
xil xona ID bilan kiring — bir-biringizni ko'rasiz.

> Vite dev-server `/ws` ni avtomatik backend (`:8000`) ga proksi qiladi.

---

## 🐳 Production (Docker)

```powershell
cd web
docker compose up --build
```

So'ng **http://localhost:8080** ni oching. nginx qurilgan React'ni beradi va `/ws` ni
backend konteyneriga proksi qiladi.

---

## ⚠️ Muhim eslatmalar

- **HTTPS shart.** `getUserMedia` va `getDisplayMedia` faqat `localhost` yoki **HTTPS**
  saytlarda ishlaydi. Boshqa qurilma/IP orqali ochmoqchi bo'lsangiz, TLS sertifikat
  (masalan nginx + Let's Encrypt) sozlang.
- **STUN** kiritilgan (`stun.l.google.com`). Turli tarmoqlar (uy ↔ ofis) orasida
  ishonchli ulanish uchun **TURN** server kerak bo'lishi mumkin — `useWebRTC.js`
  dagi `ICE_SERVERS` ga qo'shing.
- Mesh arxitekturasi 2–4 ishtirokchi uchun qulay; ko'proq foydalanuvchi uchun SFU
  (server-tomon media) kerak bo'ladi.

## 🗂 Tuzilma

```
web/
├── backend/   FastAPI signaling (main.py, rooms.py)
└── frontend/  React + Vite (src/hooks/useWebRTC.js — yadro)
```
