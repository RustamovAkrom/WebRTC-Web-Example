# 🚀 Koyeb'ga bepul deploy (kartasiz)

Bu ilova **bitta Docker konteyner** sifatida deploy qilinadi: `web/Dockerfile` frontend'ni
quradi va FastAPI backend uni + signaling'ni bitta URL'dan beradi. Koyeb avtomatik
**HTTPS** beradi — shu sabab kamera (`getUserMedia`) ishlaydi.

> Nega bitta konteyner? Bepul tarif odatda 1 ta servis beradi. Frontend + backend
> birga → bitta servis yetarli.

---

## 1. Mahalliy sinov (deploy'dan oldin, ixtiyoriy)

Push qilishdan oldin konteyner ishlashini tekshiring:

```powershell
cd web
docker build -t webrtc-app .
docker run -p 8000:8000 webrtc-app
```
Brauzerda **http://localhost:8000** — to'liq UI ochilishi kerak (bu safar bitta portda).

---

## 2. Kodni GitHub'ga joylash

Koyeb GitHub repodan avtomatik quradi. Loyiha ildizidan:

```powershell
cd e:/Applications/WebRTC
git init
git add .
git commit -m "WebRTC video chat"
# GitHub'da yangi repo yarating, keyin:
git remote add origin https://github.com/FOYDALANUVCHI/REPO.git
git branch -M main
git push -u origin main
```

> ⚠️ Eslatma: ildizdagi `reciever.py` da ilgari ko'ringan token bo'lsa, push'dan oldin
> uni olib tashlang (maxfiy kalitlarni GitHub'ga qo'ymang).

---

## 3. Koyeb'da deploy

1. [koyeb.com](https://www.koyeb.com/) ga kiring (GitHub bilan ro'yxatdan o'ting — kartasiz).
2. **Create Service → GitHub** → repongizni tanlang.
3. **Builder:** `Dockerfile` ni tanlang.
4. **Work directory / Dockerfile location:**
   - Work directory: `web`
   - Dockerfile: `web/Dockerfile` (yoki context `web` bo'lsa `Dockerfile`)
5. **Port:** `8000` (Dockerfile bilan mos).
6. **Instance:** Free (Eco/nano).
7. **Deploy** bosing.

Bir-ikki daqiqada Koyeb sizga manzil beradi, masalan:
`https://webrtc-app-foydalanuvchi.koyeb.app`

---

## 4. Foydalanish

- Bu manzilni oching → xona ID + ism kiriting.
- **Boshqalarni taklif qilish:** xuddi shu manzilni ulashing, ular bir xil **Xona ID**
  ni kiritsa, bir xonada uchrashasiz.
- HTTPS avtomatik bo'lgani uchun kamera/mikrofon barcha qurilmalarda ishlaydi.

---

## Cheklov va keyingi qadam

- **Scale-to-zero:** Koyeb free trafik bo'lmasa uxlaydi, birinchi so'rovda 0.2–5s da
  uyg'onadi (deyarli sezilmaydi).
- **STUN-only:** hozir faqat Google STUN ishlatilyapti. Aksariyat tarmoqlarda ishlaydi,
  lekin qattiq NAT/firewall ortidagi foydalanuvchilar ulanolmasa — `frontend/src/hooks/
  useWebRTC.js` dagi `ICE_SERVERS` ga bepul **TURN** (ExpressTURN / Metered) qo'shing.
- **Mesh cheklovi:** 2–4 ishtirokchi qulay; kattaroq guruh uchun SFU kerak.
