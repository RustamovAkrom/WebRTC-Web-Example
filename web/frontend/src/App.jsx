import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import Room from "./components/Room.jsx";

export default function App() {
  const { loading } = useAuth();

  // Auth holati aniqlanmaguncha kutamiz
  if (loading) {
    return (
      <div className="join">
        <div className="splash">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Authentication */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Room */}
        <Route path="/room/:roomId" element={<RoomWrapper />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// Room wrapper - URL'dan room ID oladi
function RoomWrapper() {
  const { pathname } = window.location;
  // /room/xyz -> xyz
  const roomId = pathname.split("/room/")[1] || "";

  return (
    <Room
      room={roomId}
      onLeave={() => window.location.href = "/"}
    />
  );
}
