# Bitta konteyner: React frontend'ni quradi va FastAPI backend uni + signaling'ni beradi.
# Koyeb (yoki istalgan Docker hosting) uchun mo'ljallangan. Build context: web/

# --- 1-bosqich: frontend'ni qurish ---
FROM node:22-alpine AS frontend
WORKDIR /fe
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build          # natija: /fe/dist

# --- 2-bosqich: backend + qurilgan UI ---
FROM python:3.12-slim
WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
# Qurilgan frontend'ni backend yonidagi `static/` ga joylaymiz (main.py shu yerdan topadi).
COPY --from=frontend /fe/dist ./static

# Koyeb $PORT muhit o'zgaruvchisini beradi (standart 8000).
ENV PORT=8000
EXPOSE 8000

# shell-form: $PORT kengaytirilishi uchun.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
