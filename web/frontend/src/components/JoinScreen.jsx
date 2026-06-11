import { useState } from "react";

const NAME_KEY = "webrtc-chat-name"; // localStorage kaliti — ismni eslab qolish uchun

export default function JoinScreen({ onJoin, defaultRoom = "" }) {
  // URL'dan kelgan xona bo'lsa o'shani, bo'lmasa standart nomni ishlatamiz.
  const [room, setRoom] = useState(defaultRoom || "test-room");
  // Oldingi kirishdan saqlangan ismni avtomatik qo'yamiz.
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || "");

  // URL'da ?room=... bo'lsa, foydalanuvchi havola orqali taklif qilingan.
  const invited = Boolean(defaultRoom);

  const submit = (e) => {
    e.preventDefault();
    const r = room.trim();
    const n = name.trim();
    if (r && n) {
      localStorage.setItem(NAME_KEY, n); // keyingi safar uchun eslab qolamiz
      onJoin({ room: r, name: n });
    }
  };

  return (
    <div className="join">
      <form className="join-card" onSubmit={submit}>
        <h1>🎥 WebRTC Video Chat</h1>
        <p className="muted">
          {invited
            ? `Sizni "${defaultRoom}" xonasiga taklif qilishdi`
            : "Xonaga kirib video suhbatni boshlang"}
        </p>
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
            readOnly={invited}
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
