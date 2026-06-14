# Bitta konteyner: React frontend'ni quradi va FastAPI backend uni + signaling'ni beradi.
# Railway / Koyeb / istalgan Docker hosting uchun. Build context: web/
#
# Muhim: DATABASE_URL environment variable Railway'da PostgreSQL service orqali avtomatik beriladi.
# JWT_SECRET, CORS_ORIGINS va boshqa variables Railway dashboard'da sozlanadi.

# --- 1-bosqich: frontend'ni qurish ---
FROM node:22-alpine AS frontend
WORKDIR /fe
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build          # natija: /fe/dist

# --- 2-bosqich: backend + qurilgan UI ---
FROM python:3.12-slim

# Environment
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# PostgreSQL client (migrations uchun)
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Backend code
COPY backend/ ./

# Qurilgan frontend'ni backend static/ ga ko'chirish
COPY --from=frontend /fe/dist ./static

EXPOSE 8000

# Start script - serverni ishga tushiradi
COPY <<'EOF' /app/start.sh
#!/bin/sh
set -e
echo "🚀 Starting WebRTC server..."
echo "📊 Database: ${DATABASE_URL:+configured}"
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
EOF
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
