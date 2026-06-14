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
        // Token'ni saqlash
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Back to Home */}
        <div className="mb-8">
          <Link
            to="/"
            className="text-white hover:text-pink-300 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Bosh sahifaga qaytish
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Xush kelibsiz!</h1>
            <p className="text-gray-300">Hisobingizga kiring</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6">
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
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400"
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
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400"
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white py-3 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Yuklanmoqda..." : "Kirish"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Hisobingiz yo'qmi?{" "}
              <Link to="/register" className="text-pink-400 hover:text-pink-300 font-medium">
                Ro'yxatdan o'tish
              </Link>
            </p>
          </div>
        </div>

        {/* Guest Login */}
        <div className="mt-6 text-center">
          <p className="text-gray-300 mb-3">Yoki mehmon sifatida</p>
          <button
            onClick={() => navigate("/")}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-colors"
          >
            Mehmon sifatida kirish
          </button>
        </div>
      </div>
    </div>
  );
}
