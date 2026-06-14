import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("/api/auth/login", formData);
      if (response.data.access_token) {
        localStorage.setItem("access_token", response.data.access_token);
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Kirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Back to Home */}
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="text-gray-400 hover:text-green-500 transition-colors inline-flex items-center gap-2"
          >
            ← Bosh sahifaga qaytish
          </Link>
        </div>

        {/* Login Card */}
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Xush kelibsiz!</h1>
            <p className="text-gray-400">Hisobingizga kiring</p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white mb-2 font-medium">Foydalanuvchi nomi</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Ismingiz"
              />
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Parol</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Yuklanmoqda..." : "Kirish"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Hisobingiz yo'qmi?{" "}
              <Link to="/register" className="text-green-500 hover:text-green-400 font-medium">
                Ro'yxatdan o'tish
              </Link>
            </p>
          </div>
        </div>

        {/* Guest Login */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 mb-3">Yoki mehmon sifatida</p>
          <button
            onClick={() => navigate("/")}
            className="btn-secondary w-full"
          >
            Mehmon sifatida kirish
          </button>
        </div>
      </div>
    </div>
  );
}
