# 06 — Loyiha qo'llanmasi: kodni ishga tushirish

Bu loyihada `aiortc` yordamida bitta mashinadagi kamera oqimini WebRTC orqali
boshqa mashinaga (yoki bir xil kompyuterda ikkita terminalga) jonli uzatamiz.

## Loyiha tuzilmasi

```
WebRTC/
├── docs/                    ← bu hujjatlar
├── sender.py                ← kamerani o'qib, oqimni UZATADI (offer yaratadi)
├── reciever.py              ← oqimni QABUL qilib, ekranda ko'rsatadi (answer beradi)
├── requirements.txt         ← kerakli kutubxonalar
└── README.md
```

## Komponentlarning roli

| Fayl | Rol | Signaling |
|------|-----|-----------|
| `sender.py` | **TCP server** + uzatuvchi | `0.0.0.0:9999` da tinglaydi, **avval ishga tushiriladi** |
| `reciever.py` | **TCP mijoz** + qabul qiluvchi | sender IP:port ga ulanadi |

> ⚠️ **Muhim:** aiortc'ning `TcpSocketSignaling` da birinchi `send()` qilgan tomon
> **server**, birinchi `receive()` qilgan tomon **mijoz** bo'ladi. Sender birinchi
> bo'lib OFFER `send()` qilgani uchun **u TCP server** — shuning uchun **sender'ni
> receiver'dan oldin** ishga tushirish kerak. Receiver unga ulanadi.

## 1-qadam: kutubxonalarni o'rnatish

```powershell
# (tavsiya) virtual muhit
python -m venv .venv
.\.venv\Scripts\Activate.ps1        # Windows PowerShell

pip install -r requirements.txt
```

## 2-qadam: ishga tushirish

### Variant A — bitta kompyuterda sinash (eng oson)

Ikkita alohida terminal oching:

**Terminal 1 — sender (avval ishga tushiring, u server):**
```powershell
python sender.py
```

**Terminal 2 — receiver:**
```powershell
python reciever.py
```

Standart holatda receiver `127.0.0.1:9999` ga ulanadi, shuning uchun hech narsa
sozlamasdan ishlaydi. Kamera oynasi ochilib, jonli video ko'rinishi kerak.

### Variant B — ikkita alohida kompyuter (bir xil tarmoqda)

1. **Sender** (kamerali) kompyuterda uning IP manzilini aniqlang:
   ```powershell
   ipconfig        # masalan 192.168.1.10
   ```
2. **Sender**ni ishga tushiring (u barcha interfeyslarda tinglaydi):
   ```powershell
   python sender.py --camera 0
   ```
3. **Receiver** kompyuterda sender IP'sini ko'rsatib ishga tushiring:
   ```powershell
   python reciever.py --signaling-host 192.168.1.10
   ```

## 3-qadam: chiqishdan

- Receiver oynasida **`q`** tugmasini bosing — dastur to'xtaydi.
- Yoki terminalda **Ctrl+C**.

## Komanda qatori parametrlari

### `sender.py` (server)
| Parametr | Standart | Tavsif |
|----------|----------|--------|
| `--signaling-host` | `0.0.0.0` | Tinglash manzili (server) |
| `--signaling-port` | `9999` | Signaling porti |
| `--camera` | `0` | Kamera ID (`0` — asosiy kamera) |

### `reciever.py` (mijoz)
| Parametr | Standart | Tavsif |
|----------|----------|--------|
| `--signaling-host` | `127.0.0.1` | Sender IP manzili (unga ulanadi) |
| `--signaling-port` | `9999` | Signaling porti |
| `--record` | (yo'q) | Kelgan oqimni shu faylga yozish (masalan `out.mp4`) |

## Muammolarni bartaraf etish

| Belgilar | Sabab / yechim |
|----------|----------------|
| "Kamera ochilmadi" | Boshqa dastur kamerani band qilgan yoki `--camera` ID noto'g'ri |
| Oyna qora | Sender kameradan kadr ololmayapti — ID'ni almashtiring (`1`, `2`) |
| `Connection refused` / `WinError 1214` | **Avval sender'ni** ishga tushiring (u server), port/IP to'g'rimi tekshiring |
| Ulanish `failed` (turli tarmoq) | STUN/TURN kerak — qarang [05-python-aiortc](./05-python-aiortc.md) |
| Sekin / uzilib qoladi | Tarmoq bandligi yoki kamera FPS yuqori — past rezolyutsiya sinang |

## Keyingi qadamlar (production sari)

- TCP signaling o'rniga **WebSocket signaling server** (FastAPI) yozish
- **STUN/TURN** sozlash (internet orqali ishlash uchun)
- Audio track qo'shish
- Brauzer (JavaScript) mijozi bilan integratsiya
- Bir nechta foydalanuvchi uchun **room/SFU** mantiqini qo'shish

Nazariy asoslar uchun: [01 — WebRTC nima](./01-webrtc-nima.md) dan boshlang.
