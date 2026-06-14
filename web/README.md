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

## 🚀 Railway Deploy (Production)

### Tezkor deploy (1 komanda)

```powershell
# Railway CLI o'rnatish (bir marta)
npm install -g @railway/cli

# Login
railway login

# Deploy (web/ papkasida)
cd web
railway up
```

Yoki PowerShell script:
```powershell
cd web
.\deploy.ps1
```

### PostgreSQL ulash

Railway dashboard'da:
1. **Project** → **Add PostgreSQL** (yoki **Add Service** → **PostgreSQL**)
2. Database avtomatik provision qilinadi
3. `DATABASE_URL` environment variable avtomatik qo'shiladi

### Environment Variables

Railway dashboard → **Variables** bo'limida:

```env
# Majburiy
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
JWT_SECRET=<kuchli kalit>

# Production sozlamalar
ENVIRONMENT=prod
CORS_ORIGINS=https://your-app.railway.app
COOKIE_SECURE=true
PERSIST_CHAT=true
```

JWT_SECRET generatsiya:
```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### GitHub Auto-Deploy

Har safar `main` branch'ga push qilinganda avtomatik deploy:

1. Railway dashboard'da **GitHub** ni ulang
2. Repository va branch tanlang
3. **Root Directory** = `web`
4. Auto-deploy yoqilgan bo'ladi

Yoki GitHub Actions workflow ishlatiladi (`.github/workflows/deploy.yml`).

### Deploy Script

```powershell
# Full deploy script (PowerShell)
.\deploy.ps1

# Yoki bash
bash deploy.sh
```

### PostgreSQL CLI (ixtiyoriy)

Database'ni tekshirish:
```bash
# Railway CLI bilan
railway run psql $DATABASE_URL -c "\dt"

# Yoki Railway dashboard → Postgres → Open PSQL
```

---

## ⚠️ Muhim eslatmalar

- **HTTPS shart.** `getUserMedia` va `getDisplayMedia` faqat `localhost` yoki **HTTPS**
  saytlarda ishlaydi. Railway avtomatik HTTPS beradi.
- **STUN** kiritilgan (`stun.l.google.com`). Turli tarmoqlar (uy ↔ ofis) orqali
  ishonchli ulanish uchun **TURN** server kerak bo'lishi mumkin.
- Mesh arxitekturasi 2–4 ishtirokchi uchun qulay; ko'proq foydalanuvchi uchun SFU
  (server-tomon media) kerak bo'ladi.

## 🗂 Tuzilma

```
web/
├── backend/           FastAPI signaling (main.py, rooms.py)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/          React + Vite
│   ├── Dockerfile
│   ├── package.json
│   └── nginx.conf
├── Dockerfile         # Full-stack monolith (Railway)
├── docker-compose.yml # Local development
├── railway.json       # Railway config
├── deploy.ps1         # PowerShell deploy script
├── deploy.sh          # Bash deploy script
└── RAILWAY_DEPLOY.md  # Batafsil deploy qo'llanma
```

## 📖 Qo'shimcha hujjatlar

- [RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md) — Railway deploy batafsil
- [../docs/07-web-fullstack.md](../docs/07-web-fullstack.md) — Arxitektura
- [../README.md](../README.md) — Asosiy loyiha
