// RegisterPage — ro'yxatdan o'tish. httpOnly cookie sessiyasi (AuthContext orqali);
// backend UserCreate kontrakti: username, display_name (majburiy), password, email (ixtiyoriy).
// Eski sahifa display_name yubormas edi (registratsiya 422 bilan buzilardi) — tuzatildi.

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    display_name: "",
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Parollar mos kelmaydi");
      return;
    }
    if (form.password.length < 8) {
      setError("Parol kamida 8 ta belgidan iborat bo'lishi kerak");
      return;
    }

    setLoading(true);
    try {
      await register({
        username: form.username.trim(),
        display_name: form.display_name.trim() || form.username.trim(),
        email: form.email.trim() || null,
        password: form.password,
      });
      navigate("/");
    } catch (err) {
      setError(err.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <Header />
      <main className="auth-page">
        <div className="auth-card">
          <div className="card">
            <div className="auth-head">
              <h1>Hisob yarating</h1>
              <p>Bepul va bir daqiqada</p>
            </div>

            {error && <div className="auth-alert">{error}</div>}

            <form className="auth-form" onSubmit={onSubmit}>
              <label className="field">
                <span>Ko'rinadigan ism</span>
                <input
                  name="display_name"
                  value={form.display_name}
                  onChange={onChange}
                  placeholder="Masalan: Akrom"
                  autoComplete="name"
                  autoFocus
                />
              </label>

              <label className="field">
                <span>Foydalanuvchi nomi</span>
                <input
                  name="username"
                  value={form.username}
                  onChange={onChange}
                  placeholder="username"
                  autoComplete="username"
                  required
                  minLength={3}
                />
              </label>

              <label className="field">
                <span>Email (ixtiyoriy)</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="email@example.com"
                  autoComplete="email"
                />
              </label>

              <label className="field">
                <span>Parol</span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
                <span className="field-hint">Kamida 8 ta belgi</span>
              </label>

              <label className="field">
                <span>Parolni tasdiqlang</span>
                <input
                  type="password"
                  name="confirm"
                  value={form.confirm}
                  onChange={onChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </label>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={loading || !form.username.trim() || !form.password}
              >
                {loading ? "Yaratilmoqda…" : "Ro'yxatdan o'tish"}
              </button>
            </form>

            <p className="auth-alt">
              Hisobingiz bormi?{" "}
              <Link to="/login" className="btn-link">
                Kirish
              </Link>
            </p>
          </div>

          <p className="auth-alt">
            <Link to="/" className="btn-link">
              ← Mehmon sifatida davom etish
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
