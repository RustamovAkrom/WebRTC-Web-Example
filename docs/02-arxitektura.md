# 02 — Arxitektura: NAT, STUN, TURN va ICE

WebRTC'ning eng murakkab qismi — ikkita qurilmani **internet orqali topib, bir-biriga
ulash**. Mahalliy tarmoqlar (router/NAT) ortida joylashgan qurilmalar bir-birining
haqiqiy manzilini bilmaydi. Quyidagi tushunchalar shu muammoni hal qiladi.

## NAT muammosi

Ko'pchilik qurilmalar **NAT** (Network Address Translation) ortida turadi — ya'ni
ularning ichki manzili (masalan `192.168.1.5`) internetdan ko'rinmaydi. Tashqaridan
faqat router'ning umumiy (public) IP manzili ko'rinadi.

```
   [Telefon A]                                [Noutbuk B]
  192.168.1.5  ──▶ [Router/NAT] ──▶ Internet ◀── [Router/NAT] ◀── 10.0.0.7
                    Public IP:                     Public IP:
                    85.x.x.x                        92.x.x.x
```

Savol: A qurilma B'ga to'g'ridan-to'g'ri qanday paket yuboradi? Buning uchun har biri
o'zining **tashqaridan ko'rinadigan manzilini** bilishi kerak.

## STUN — "Mening tashqi manzilim qanday?"

**STUN** (Session Traversal Utilities for NAT) serveri qurilmaga uning **public IP va
port**ini aytib beradi. Bu yengil va arzon xizmat.

```
  A ──▶ STUN server: "Meni qanday ko'ryapsan?"
  A ◀── STUN server: "Sen 85.x.x.x:54321 ko'rinasan"
```

Google ochiq STUN serverlari beradi, masalan: `stun:stun.l.google.com:19302`.

Aksariyat (~80%) holatlarda faqat STUN yetarli — ulanish to'g'ridan-to'g'ri o'rnatiladi.

## TURN — "To'g'ridan-to'g'ri bo'lmasa, men orqali o'tkaz"

Ba'zi qattiq NAT yoki korporativ firewall'larda P2P ulanish umuman mumkin emas.
Bunday holatda **TURN** (Traversal Using Relays around NAT) serveri **relay** (vositachi)
sifatida ishlaydi — butun trafik shu server orqali o'tadi.

```
  A ──▶ TURN server ──▶ B        (P2P ishlamaganda zaxira yo'l)
```

- TURN ko'proq resurs talab qiladi (server trafikni o'zi tashiydi).
- Lekin ulanishni **deyarli har doim kafolatlaydi**.
- Masalan `coturn` — eng mashhur ochiq TURN server dasturi.

## ICE — barcha yo'llarni sinab ko'rib, eng yaxshisini tanlash

**ICE** (Interactive Connectivity Establishment) — bu **framework** bo'lib, yuqoridagilarni
birlashtiradi. U barcha mumkin bo'lgan ulanish yo'llarini (**ICE candidates**) yig'adi:

1. **Host candidate** — qurilmaning o'z mahalliy manzili
2. **Server-reflexive candidate** — STUN orqali aniqlangan public manzil
3. **Relay candidate** — TURN server orqali

Keyin ICE bu yo'llarni **juftma-juft sinab ko'radi** va ishlaydigan eng tezini tanlaydi.

```
ICE jarayoni:
  1. Nomzodlarni yig'ish (gather candidates)
  2. Ularni signaling orqali boshqa tugunga yuborish
  3. Connectivity check (ping-pong)
  4. Eng yaxshi juftlikni tanlash → ulanish o'rnatildi ✅
```

## Umumiy rasm

```
                    ┌─────────────────┐
                    │  Signaling      │  ← SDP va ICE candidate'lar almashinadi
                    │  server         │     (WebSocket / TCP / boshqa)
                    └────────┬────────┘
                             │ (faqat ulanish boshida)
            ┌────────────────┴────────────────┐
            ▼                                  ▼
      ┌──────────┐    STUN/TURN dan      ┌──────────┐
      │  Peer A  │    foydalanib          │  Peer B  │
      │ (sender) │◀════ MEDIA / DATA ════▶│(receiver)│
      └──────────┘    (to'g'ridan-to'g'ri) └──────────┘
```

E'tibor bering: **signaling server faqat tanishtirish uchun** kerak. Ulanish o'rnatilgach,
media to'g'ridan-to'g'ri oqadi.

## Xulosa

| Komponent | Vazifasi |
|-----------|----------|
| **NAT** | Muammo: ichki manzillar tashqaridan ko'rinmaydi |
| **STUN** | Public manzilni aniqlaydi (yengil) |
| **TURN** | P2P imkonsiz bo'lsa, relay qiladi (og'ir, lekin ishonchli) |
| **ICE** | Hamma yo'llarni sinab, eng yaxshisini tanlaydi |

Keyingi: [03 — Signaling](./03-signaling.md) — SDP va offer/answer almashinuvi.
