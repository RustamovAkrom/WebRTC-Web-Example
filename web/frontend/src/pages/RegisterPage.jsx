import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    if (formData.password !== formData.confirmPassword) {
      setError("Parollar mos kelmaydi");
      return;
    }

    if (formData.password.length < 8) {
      setError("Parol kamida 8 ta belgidan iborat bo'lishi kerak");
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await axios.post("/api/auth/register", registerData);
      if (response.data.access_token) {
        localStorage.setItem("access_token", response.data.access_token);
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Ro'yxatdan o'tishda xatolik yuz berdi");
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

        {/* Register Card */}
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Hisob yarating</h1>
            <p className="text-gray-400">Bepul va 2 daqiqada</p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white mb-2 font-medium">Foydalanuvchi nomi</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                minLength={3}
                className="input-field"
                placeholder="Ismingiz"
              />
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="example@email.com"
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
                minLength={8}
                className="input-field"
                placeholder="********"
              />
              <p className="text-gray-400 text-sm mt-1">Kamida 8 ta belgi</p>
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Parolni tasdiqlang</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
                className="input-field"
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Yuklanmoqda..." : "Ro'yxatdan o'tish"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Hisobingiz bormi?{" "}
              <Link to="/login" className="text-green-500 hover:text-green-400 font-medium">
                Kirish
              </Link>
            </p>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Ro'yxatdan o'tish bilan siz{" "}
          <a href="#" className="text-green-500 hover:underline">Foydalanish shartlari</a>
          {" "}va{" "}
          <a href="#" className="text-green-500 hover:underline">Maxfiylik siyosatiga</a>
          {" "}rozilik bildirasiz.
        </div>
      </div>
    </div>
  );
}
