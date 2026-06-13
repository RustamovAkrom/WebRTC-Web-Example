import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import AuthModal from "./AuthModal.jsx";

const NAME_KEY = "webrtc-chat-name"; // localStorage kaliti — ismni eslab qolish uchun

export default function JoinScreen({ onJoin, defaultRoom = "" }) {
  const { user, logout } = useAuth();
  const { resolved, toggleTheme } = useTheme();

  const [room, setRoom] = useState(defaultRoom || "test-room");
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || "");
  const [authOpen, setAuthOpen] = useState(false);

  // Login bo'lgan foydalanuvchining ismi ishonchli — uni majburlaymiz.
  useEffect(() => {
    if (user) setName(user.display_name);
  }, [user]);

  const invited = Boolean(defaultRoom);

  const submit = (e) => {
    e.preventDefault();
    const r = room.trim();
    const n = name.trim();
    if (r && n) {
      if (!user) localStorage.setItem(NAME_KEY, n);
      onJoin({ room: r, name: n });
    }
  };

  return (
    <div className="join">
      <button className="theme-fab" onClick={toggleTheme} title="Mavzu">
        {resolved === "dark" ? "☀️" : "🌙"}
      </button>

      <form className="join-card" onSubmit={submit}>
        <h1>🎥 Meet</h1>
        <p className="muted">
          {invited
            ? `Sizni "${defaultRoom}" xonasiga taklif qilishdi`
            : "Xonaga kirib video suhbatni boshlang"}
        </p>

        <label>
          Ismingiz
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

        <label>
          Xona ID
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="xona nomi"
            readOnly={invited}
          />
        </label>

        <button type="submit" disabled={!room.trim() || !name.trim()}>
          Kirish
        </button>

        <div className="auth-line">
          {user ? (
            <button type="button" className="link-btn" onClick={logout}>
              Chiqish ({user.display_name})
            </button>
          ) : (
            <button
              type="button"
              className="link-btn"
              onClick={() => setAuthOpen(true)}
            >
              Kirish / Ro'yxatdan o'tish (ixtiyoriy)
            </button>
          )}
        </div>

        <p className="hint">
          Bir xil <b>Xona ID</b> ni kiritganlar bir-birini ko'radi.
        </p>
      </form>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
