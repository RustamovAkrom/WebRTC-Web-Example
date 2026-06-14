import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import Lobby from "./components/Lobby.jsx";
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
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/room/:roomId" element={<RoomRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// /room/:roomId — avval Lobby (ism + kamera/mikrofon tekshiruvi), keyin Room.
function RoomRoute() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [joined, setJoined] = useState(null); // null | { name, camOn, micOn }

  const room = decodeURIComponent(roomId || "");

  if (!room) return <Navigate to="/" replace />;

  if (!joined) {
    return <Lobby room={room} onJoin={setJoined} />;
  }

  return (
    <Room
      room={room}
      name={joined.name}
      initialCamOn={joined.camOn}
      initialMicOn={joined.micOn}
      onLeave={() => navigate("/")}
    />
  );
}
