import { useState } from "react";
import JoinScreen from "./components/JoinScreen.jsx";
import Room from "./components/Room.jsx";

// URL'dan xona ID ni o'qiymiz (?room=...) — taklif havolasi orqali kirish uchun.
function roomFromUrl() {
  return new URLSearchParams(window.location.search).get("room") || "";
}

export default function App() {
  const [session, setSession] = useState(null); // { room, name }

  const handleJoin = ({ room, name }) => {
    // Brauzer manzilini xona bilan yangilaymiz, shunda havolani ulashish mumkin.
    const url = `${window.location.pathname}?room=${encodeURIComponent(room)}`;
    window.history.replaceState(null, "", url);
    setSession({ room, name });
  };

  const handleLeave = () => {
    setSession(null);
  };

  if (!session) {
    return <JoinScreen defaultRoom={roomFromUrl()} onJoin={handleJoin} />;
  }
  return (
    <Room room={session.room} name={session.name} onLeave={handleLeave} />
  );
}
