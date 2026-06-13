// AuthModal — kirish / ro'yxatdan o'tish oynasi (ixtiyoriy).
// Mehmon yo'liga xalaqit bermaydi — faqat xohlovchilar ochadi.

import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthModal({ open, onClose }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await login(username.trim(), password);
      } else {
        await register({
          username: username.trim(),
          password,
          display_name: displayName.trim() || username.trim(),
          email: email.trim() || null,
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="join-card modal-card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Kirish
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Ro'yxatdan o'tish
          </button>
        </div>

        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            autoFocus
          />
        </label>

        {mode === "register" && (
          <>
            <label>
              Ko'rinadigan ism
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Masalan: Akrom"
              />
            </label>
            <label>
              Email (ixtiyoriy)
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </label>
          </>
        )}

        <label>
          Parol
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={busy || !username.trim() || !password}>
          {busy ? "..." : mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
        </button>
        <button type="button" className="ghost-btn" onClick={onClose}>
          Bekor qilish
        </button>
      </form>
    </div>
  );
}
