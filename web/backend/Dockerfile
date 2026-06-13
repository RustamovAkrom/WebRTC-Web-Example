# WebRTC signaling + REST API backend (FastAPI)
FROM python:3.12-slim

# Tezroq, toza loglar uchun
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Root bo'lmagan foydalanuvchi (xavfsizlik)
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

# Compose'da `migrate` xizmati bu CMD ni `alembic upgrade head` ga almashtiradi.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
