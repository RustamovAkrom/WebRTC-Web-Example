// Lobby — xonaga kirishdan oldingi "tayyorgarlik" ekrani.
//
// Vazifasi: ism olish (bo'sh ism bilan xonaga kirib qolishning oldini oladi) va
// kirishdan oldin kamera/mikrofonni tekshirish. "Kirish" bosilganda Room shu
// ism va kamera/mikrofon holati bilan mount qilinadi.

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const NAME_KEY = "webrtc-chat-name"; // mehmon ismini eslab qolish uchun

export default function Lobby({ room, onJoin }) {
  const { user } = useAuth();
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || "");
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [hasVideo, setHasVideo] = useState(false);
  const [mediaError, setMediaError] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Login bo'lgan foydalanuvchining ismi ishonchli — uni majburlaymiz.
  useEffect(() => {
    if (user) setName(user.display_name);
  }, [user]);

  // Kamera/mikrofon preview oqimini bir marta olamiz.
  useEffect(() => {
    let cancelled = false;
    const md = navigator.mediaDevices;
    if (!md || !md.getUserMedia) {
      setMediaError(
        "Kamera/mikrofon faqat localhost yoki HTTPS'da ishlaydi. Ko'ruvchi rejimida kirishingiz mumkin."
      );
      return;
    }
    md.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setHasVideo(stream.getVideoTracks().length > 0);
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((e) => {
        if (!cancelled) {
          setMediaError(
            "Kamera/mikrofon ochilmadi (ruxsat berilmagan yoki band bo'lishi mumkin)."
          );
          console.warn("lobby getUserMedia:", e.name);
        }
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // Preview oqimida track'larni yoqib/o'chirib turamiz (ko'rinish uchun).
  const toggleCam = () => {
    setCamOn((on) => {
      const next = !on;
      const t = streamRef.current?.getVideoTracks()[0];
      if (t) t.enabled = next;
      return next;
    });
  };
  const toggleMic = () => {
    setMicOn((on) => {
      const next = !on;
      const t = streamRef.current?.getAudioTracks()[0];
      if (t) t.enabled = next;
      return next;
    });
  };

  const submit = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    if (!user) localStorage.setItem(NAME_KEY, n);
    // Preview oqimini to'xtatamiz — Room o'z oqimini yangidan oladi.
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    onJoin({ name: n, camOn, micOn });
  };

  return (
    <div className="page-shell">
      <Header />
      <main className="auth-page">
        <div className="lobby-grid">
          {/* Kamera ko'rinishi */}
          <div className="lobby-preview">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ display: hasVideo && camOn ? "block" : "none" }}
            />
            {(!hasVideo || !camOn) && (
              <div className="preview-empty">
                <span style={{ fontSize: "2rem" }}>{camOn ? "📷" : "🚫"}</span>
                <span>{mediaError || (camOn ? "Kamera yuklanmoqda…" : "Kamera o'chirilgan")}</span>
              </div>
            )}
            <div className="preview-controls">
              <button
                type="button"
                className={micOn ? "" : "off"}
                onClick={toggleMic}
                title="Mikrofon"
                aria-label="Mikrofonni almashtirish"
              >
                {micOn ? "🎤" : "🔇"}
              </button>
              <button
                type="button"
                className={camOn ? "" : "off"}
                onClick={toggleCam}
                title="Kamera"
                aria-label="Kamerani almashtirish"
              >
                {camOn ? "🎥" : "📷"}
              </button>
            </div>
          </div>

          {/* Ism + kirish */}
          <form className="card lobby-card" onSubmit={submit}>
            <h1>Xonaga qo'shilish</h1>
            <p className="muted">
              <b>{room}</b> xonasiga kirmoqdasiz
            </p>

            <label className="field">
              <span>Ismingiz</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Akrom"
                readOnly={Boolean(user)}
                autoFocus={!user}
              />
            </label>
            {user && (
              <p className="verified-badge">✓ {user.username} sifatida tasdiqlangan</p>
            )}

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={!name.trim()}>
              Kirish
            </button>

            <p className="auth-alt" style={{ margin: 0 }}>
              {user ? (
                <span className="muted">Hisobingiz bilan kirdingiz</span>
              ) : (
                <>
                  Hisobingiz bormi?{" "}
                  <Link to="/login" className="btn-link">
                    Kirish
                  </Link>
                </>
              )}
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
