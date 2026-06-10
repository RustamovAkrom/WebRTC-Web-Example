# 01 — WebRTC nima?

## Qisqacha ta'rif

**WebRTC** (Web Real-Time Communication) — bu brauzerlar va ilovalar o'rtasida
**real vaqtda** (real-time) audio, video va ixtiyoriy ma'lumotlarni **to'g'ridan-to'g'ri
(peer-to-peer, P2P)** uzatish imkonini beruvchi ochiq standart va texnologiyalar to'plami.

Oddiy qilib aytganda: ikkita qurilma (yoki brauzer) o'rtasida **server orqali emas, balki
to'g'ridan-to'g'ri** video qo'ng'iroq, ekran ulashish yoki fayl uzatishni amalga oshiradi.

> WebRTC — Google tomonidan boshlangan, hozirda **W3C** (API standarti) va **IETF**
> (protokollar) tomonidan qo'llab-quvvatlanadigan ochiq standart. Barcha zamonaviy
> brauzerlarda (Chrome, Firefox, Safari, Edge) o'rnatilgan holda keladi.

## Nima uchun kerak?

An'anaviy yondashuvda har bir media kadr (frame) avval serverga, keyin qabul qiluvchiga
boradi — bu **kechikish (latency)** va **server yuki**ni oshiradi.

WebRTC bu muammoni hal qiladi:

```
An'anaviy (server orqali):
  A  ──▶  Server  ──▶  B          (sekin, qimmat)

WebRTC (peer-to-peer):
  A  ◀────────────────▶  B        (tez, to'g'ridan-to'g'ri)
       (faqat boshida server "tanishtiradi")
```

## Asosiy xususiyatlari

| Xususiyat | Tavsif |
|-----------|--------|
| **Past kechikish** | Real vaqtda, ~100–300 ms atrofida |
| **P2P** | Ma'lumot to'g'ridan-to'g'ri ikki tugun orasida |
| **Xavfsiz** | Barcha trafik majburiy shifrlangan (DTLS / SRTP) |
| **Plagin kerak emas** | Brauzerda o'rnatilgan, qo'shimcha dastur shart emas |
| **Adaptiv** | Tarmoq sifatiga qarab bitrate'ni avtomatik moslaydi |

## Qayerda ishlatiladi?

- 📹 **Video konferensiya** — Google Meet, Discord, Zoom (web versiyasi)
- 🎮 **Cloud gaming va ekran ulashish**
- 📞 **VoIP / ovozli qo'ng'iroqlar**
- 🎥 **Jonli (live) striming va kuzatuv (monitoring) kameralari**
- 📁 **P2P fayl almashish**
- 🤖 **IoT / robototexnika** — qurilmadan jonli video oqimi

## Uchta asosiy API (brauzerda)

1. **`MediaStream` (getUserMedia)** — kamera/mikrofondan media olish
2. **`RTCPeerConnection`** — ikki tugun o'rtasidagi ulanishni boshqaradi (eng muhimi)
3. **`RTCDataChannel`** — ixtiyoriy ma'lumot (matn, fayl, o'yin holati) uzatish

Python tomonida (`aiortc`) ham aynan shu tushunchalar mavjud — qarang
[[05-python-aiortc]].

## Keyingi qadam

WebRTC ulanish qanday quriladi — STUN, TURN, ICE va NAT tushunchalari bilan
tanishish uchun: [02 — Arxitektura](./02-arxitektura.md).
