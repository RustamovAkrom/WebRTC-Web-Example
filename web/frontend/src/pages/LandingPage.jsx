import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomName.trim()) {
      navigate(`/room/${encodeURIComponent(roomName.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <div className="text-2xl font-bold">
          <span className="text-green-500">Web</span>RTC Video
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/login")}
            className="text-gray-300 hover:text-green-500 transition-colors"
          >
            Kirish
          </button>
          <button
            onClick={() => navigate("/register")}
            className="btn-primary"
          >
            Ro'yxatdan o'tish
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Real Vaqtda <span className="text-green-500">Video Chat</span>
        </h1>
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
          Xavfsiz, tez va oson. Hech qanday qo'shimcha dastur o'rnatish shart emas.
          Faqat brauzeringiz bilan ulaning.
        </p>

        {/* Join Room Form */}
        <form onSubmit={handleJoinRoom} className="max-w-xl mx-auto mb-16">
          <div className="flex gap-4">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Xona nomini kiriting..."
              className="flex-1 px-6 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              className="btn-primary"
            >
              Kirish
            </button>
          </div>
        </form>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="card text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Xavfsiz</h3>
            <p className="text-gray-400">
              End-to-end shifrlangan P2P ulanish. Ma'lumotlaringiz hech qachon serverda saqlanmaydi.
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Tez</h3>
            <p className="text-gray-400">
              Minimal kechikish bilan real vaqtda video va audio almashinuvi.
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">🌐</div>
            <h3 className="text-xl font-semibold mb-2">Barcha qurilmalarda</h3>
            <p className="text-gray-400">
              Kompyuter, telefon yoki planshet - hech qanday ilova o'rnatish shart emas.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold mb-12">Qanday ishlaydi?</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-lg font-semibold mb-2">Xona yarating</h3>
              <p className="text-gray-400 text-sm">Istalgan nom berib kirishingiz mumkin</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-lg font-semibold mb-2">Link yuboring</h3>
              <p className="text-gray-400 text-sm">Do'stlaringizga xona linkini yuboring</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-lg font-semibold mb-2">Ulangan bo'ling</h3>
              <p className="text-gray-400 text-sm">Kamera va mikrofon ruxsatini bering</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">4</div>
              <h3 className="text-lg font-semibold mb-2">Suhbat qiling</h3>
              <p className="text-gray-400 text-sm">Real vaqtda video chat'dan bahramand bo'ling</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 bg-gray-800 border border-gray-700 rounded-2xl p-12 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Hoziroq boshlang</h2>
          <p className="text-gray-400 mb-8">Hech qanday ro'yxatdan o'tish shart emas - mehmon sifatida kirishingiz mumkin</p>
          <button
            onClick={() => navigate("/register")}
            className="btn-primary"
          >
            Bepul ro'yxatdan o'tish
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 text-center text-gray-400 border-t border-gray-800 mt-20">
        <p>© 2024 WebRTC Video Chat. Barcha huquqlar himoyalangan.</p>
      </footer>
    </div>
  );
}
