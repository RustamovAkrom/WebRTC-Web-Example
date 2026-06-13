# Bitta konteyner: React frontend'ni quradi va FastAPI backend uni + signaling'ni beradi.
# Koyeb (yoki istalgan Docker hosting) uchun. Build context: web/
#
# DIQQAT: bu to'liq stack endi PostgreSQL talab qiladi (auth, akkauntlar).
# Hosting'da DATABASE_URL va JWT_SECRET muhit o'zgaruvchilarini bering.

# --- 1-bosqich: frontend'ni qurish ---
FROM node:22-alpine AS frontend
WORKDIR /fe
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build          # natija: /fe/dist

# --- 2-bosqich: backend + qurilgan UI ---
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
# Qurilgan frontend'ni backend yonidagi `static/` ga (main.py shu yerdan topadi).
COPY --from=frontend /fe/dist ./static

# Koyeb $PORT beradi (standart 8000).
ENV PORT=8000
EXPOSE 8000

# Startda DB migratsiyasini qo'llab, keyin serverni ishga tushiramiz.
# (DATABASE_URL bo'lsa migratsiya o'tadi; bo'lmasa start baribir davom etadi.)
CMD sh -c "alembic upgrade head || echo 'migratsiya o''tkazib yuborildi'; uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
