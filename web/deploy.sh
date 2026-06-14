#!/bin/bash

# Railway Full-Stack Deploy Script
# Bu script Railway CLI orqali project'ni deploy qiladi

set -e

echo "🚀 WebRTC Full-Stack Railway Deployment"
echo "========================================"

# 1. Railway CLI tekshirish
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI topilmadi. O'rnatilmoqda..."
    npm install -g @railway/cli
fi

# 2. Login tekshirish
echo "📡 Railway login tekshirilmoqda..."
railway whoami || {
    echo "🔐 Login qilinmoqda..."
    railway login
}

# 3. Project init
echo "📦 Project iniţialize qilinmoqda..."
if [ ! -f "railway.json" ]; then
    railway init
fi

# 4. Variables tekshirish
echo "⚙️  Environment variables sozlanmoqda..."
echo "   DATABASE_URL - PostgreSQL'ni ulash kerak"
echo "   JWT_SECRET - generatsiya qiling: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
echo "   ENVIRONMENT=prod"
echo "   CORS_ORIGINS=https://your-domain.railway.app"
echo "   COOKIE_SECURE=true"

# 5. Deploy
echo "🚢 Deploy qilinmoqda..."
cd web
railway up

echo "✅ Deploy tugadi!"
echo "📱 Railway dashboard: https://railway.app"
