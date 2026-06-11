import { useEffect, useRef, useState } from "react";

// Yon paneldagi real-time chat. Xabarlar useWebRTC hook'idan keladi.
export default function ChatPanel({ open, onClose, messages, onSend }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);

  // Yangi xabar kelganda pastga avtomatik aylantiramiz.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = (e) => {
    e.preventDefault();
    onSend(text);
    setText("");
  };

  return (
    <aside className={`chat ${open ? "open" : ""}`}>
      <div className="chat-header">
        <span>💬 Suhbat</span>
        <button className="chat-close" onClick={onClose} title="Yopish">
          ✕
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="muted chat-empty">
            Hali xabarlar yo'q. Birinchi bo'lib yozing!
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`chat-msg ${m.self ? "self" : ""}`}>
            {!m.self && <span className="chat-msg-name">{m.name}</span>}
            <span className="chat-msg-text">{m.text}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form className="chat-input" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Xabar yozing…"
          maxLength={1000}
        />
        <button type="submit" disabled={!text.trim()} title="Yuborish">
          ➤
        </button>
      </form>
    </aside>
  );
}
