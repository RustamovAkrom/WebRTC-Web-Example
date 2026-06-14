#!/usr/bin/env pwsh

# Railway Full-Stack Deploy Script (PowerShell)
# Bu script Railway CLI orqali project'ni deploy qiladi

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "🚀 WebRTC Full-Stack Railway Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Railway CLI tekshirish
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI topilmadi. O'rnatilmoqda..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# 2. Login tekshirish
Write-Host "📡 Railway login tekshirilmoqda..." -ForegroundColor Cyan
try {
    railway whoami
} catch {
    Write-Host "🔐 Login qilinmoqda..." -ForegroundColor Yellow
    railway login
}

# 3. Project init
Write-Host "📦 Project initialize qilinmoqda..." -ForegroundColor Cyan
if (-not (Test-Path "railway.json")) {
    railway init
}

# 4. Variables ko'rsatish
Write-Host "⚙️  Environment variables sozlanmoqda..." -ForegroundColor Cyan
Write-Host "   DATABASE_URL - PostgreSQL'ni ulash kerak:"
Write-Host "   1. Railway dashboard → Project → Add PostgreSQL"
Write-Host "   2. Variables bo'limida DATABASE_URL avtomatik qo'shiladi"
Write-Host ""
Write-Host "   JWT_SECRET - generatsiya qiling:"
Write-Host "   python -c `"import secrets; print(secrets.token_urlsafe(48))`""
Write-Host ""
Write-Host "   ENVIRONMENT=prod"
Write-Host "   CORS_ORIGINS=https://your-domain.railway.app"
Write-Host "   COOKIE_SECURE=true"

# 5. Deploy
Write-Host "🚢 Deploy qilinmoqda..." -ForegroundColor Cyan
Set-Location web
railway up

Write-Host "✅ Deploy tugadi!" -ForegroundColor Green
Write-Host "📱 Railway dashboard: https://railway.app" -ForegroundColor Green
