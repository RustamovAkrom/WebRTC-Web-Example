// LandingPage — bosh sahifa. Glass Noir token tizimi (dark+light), header/footer,
// responsive. Xona nomi kiritilsa /room/:id ga o'tadi (keyin Lobby ochiladi).

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

const FEATURES = [
  {
    ico: "🔒",
    title: "Xavfsiz",
    text: "Brauzerlar orasida to'g'ridan-to'g'ri (P2P) shifrlangan ulanish. Media oqimi serverda saqlanmaydi.",
  },
  {
    ico: "⚡",
    title: "Tez",
    text: "Minimal kechikish bilan real vaqtdagi video va audio. Hech qanday dastur o'rnatish shart emas.",
  },
  {
    ico: "🌐",
    title: "Hamma joyda",
    text: "Kompyuter, telefon yoki planshet — faqat brauzeringiz orqali bir necha soniyada ulaning.",
  },
];

const STEPS = [
  { n: 1, title: "Xona yarating", text: "Istalgan nom bering yoki tasodifiy nom ishlating." },
  { n: 2, title: "Havola yuboring", text: "Xona havolasini do'stlaringizga ulashing." },
  { n: 3, title: "Ruxsat bering", text: "Kamera va mikrofonni yoqing." },
  { n: 4, title: "Suhbatlashing", text: "Real vaqtda video suhbatdan bahramand bo'ling." },
];

function randomRoom() {
  // Qisqa, o'qilishi oson xona nomi (slug qoidasiga mos: harf/raqam/-).
  const adj = ["tezkor", "yashil", "ochiq", "tinch", "yorqin"];
  const noun = ["xona", "uchrashuv", "studiya", "maydon"];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  return `${pick(adj)}-${pick(noun)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");

  const go = (slug) => {
    const r = (slug || "").trim();
    if (r) navigate(`/room/${encodeURIComponent(r)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    go(roomName);
  };

  return (
    <div className="page-shell">
      <Header />

      <main>
        <div className="container">
          {/* Hero */}
          <section className="hero">
            <span className="eyebrow">
              <span className="dot">●</span> Ro'yxatdan o'tmasdan ham ishlaydi
            </span>
            <h1>
              Real vaqtda <span className="grad">video suhbat</span>
            </h1>
            <p className="lead">
              Xavfsiz, tez va oson. Xona nomini kiriting va bir zumda ulaning —
              hech qanday qo'shimcha dastur kerak emas.
            </p>

            <form className="hero-form" onSubmit={handleSubmit}>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Xona nomini kiriting…"
                aria-label="Xona nomi"
              />
              <button type="submit" className="btn btn-primary btn-lg" disabled={!roomName.trim()}>
                Kirish
              </button>
            </form>
            <div style={{ marginTop: "0.9rem" }}>
              <button type="button" className="btn-link" onClick={() => go(randomRoom())}>
                yoki tasodifiy xona yarating →
              </button>
            </div>
          </section>

          {/* Features */}
          <section className="section">
            <div className="feature-grid">
              {FEATURES.map((f) => (
                <div className="feature-card" key={f.title}>
                  <div className="ico">{f.ico}</div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How it works */}
          <section className="section">
            <h2 className="section-title">Qanday ishlaydi?</h2>
            <p className="section-sub">To'rt qadamda suhbatni boshlang.</p>
            <div className="steps">
              {STEPS.map((s) => (
                <div className="step" key={s.n}>
                  <div className="num">{s.n}</div>
                  <h4>{s.title}</h4>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="section">
            <div className="cta-card">
              <h2>Hoziroq boshlang</h2>
              <p>Mehmon sifatida kiring yoki bepul hisob yarating.</p>
              <button className="btn btn-primary btn-lg" onClick={() => navigate("/register")}>
                Bepul ro'yxatdan o'tish
              </button>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
