import { useState } from "react";

export default function JoinScreen({ onJoin }) {
  const [room, setRoom] = useState("test-room");
  const [name, setName] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (room.trim() && name.trim()) {
      onJoin({ room: room.trim(), name: name.trim() });
    }
  };

  return (
    <div className="join">
      <form className="join-card" onSubmit={submit}>
        <h1>🎥 WebRTC Video Chat</h1>
        <p className="muted">Xonaga kirib video suhbatni boshlang</p>
        <label>
          Ismingiz
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masalan: Akrom"
            autoFocus
          />
        </label>
        <label>
          Xona ID
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="xona nomi"
          />
        </label>
        <button type="submit" disabled={!room.trim() || !name.trim()}>
          Kirish
        </button>
        <p className="hint">
          Bir xil <b>Xona ID</b> ni kiritgan foydalanuvchilar bir-birini ko'radi.
        </p>
      </form>
    </div>
  );
}
