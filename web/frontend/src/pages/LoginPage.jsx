// LoginPage — kirish sahifasi. httpOnly cookie sessiyasi (AuthContext orqali);
// localStorage'da token SAQLANMAYDI. Glass Noir token dizayni, header/footer.

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.username.trim(), form.password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Kirishda xatolik yuz berdi");
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
              <h1>Xush kelibsiz</h1>
              <p>Hisobingizga kiring</p>
            </div>

            {error && <div className="auth-alert">{error}</div>}

            <form className="auth-form" onSubmit={onSubmit}>
              <label className="field">
                <span>Foydalanuvchi nomi</span>
                <input
                  name="username"
                  value={form.username}
                  onChange={onChange}
                  placeholder="username"
                  autoComplete="username"
                  required
                  autoFocus
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
                  autoComplete="current-password"
                  required
                />
              </label>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={loading || !form.username.trim() || !form.password}
              >
                {loading ? "Kirilmoqda…" : "Kirish"}
              </button>
            </form>

            <p className="auth-alt">
              Hisobingiz yo'qmi?{" "}
              <Link to="/register" className="btn-link">
                Ro'yxatdan o'tish
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
