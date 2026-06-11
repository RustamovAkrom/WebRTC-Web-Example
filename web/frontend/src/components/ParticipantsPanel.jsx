// Ishtirokchilar ro'yxati — chap tomondan chiquvchi panel.
// Har bir ishtirokchining ismi, mic/cam holati va gapirish belgisi ko'rsatiladi.

function Row({ name, micOn, camOn, speaking, hand, you }) {
  return (
    <div className={`pp-row ${speaking ? "speaking" : ""}`}>
      <span className="pp-avatar">{(name || "?").charAt(0).toUpperCase()}</span>
      <span className="pp-name">
        {name}
        {you && <span className="pp-you"> (siz)</span>}
      </span>
      <span className="pp-icons">
        {hand && <span title="Qo'l ko'tarilgan">✋</span>}
        <span title={micOn ? "Mikrofon yoniq" : "Mikrofon o'chiq"}>
          {micOn ? "🎤" : "🔇"}
        </span>
        <span title={camOn ? "Kamera yoniq" : "Kamera o'chiq"}>
          {camOn ? "📷" : "🚫"}
        </span>
      </span>
    </div>
  );
}

export default function ParticipantsPanel({
  open,
  onClose,
  localName,
  micOn,
  camOn,
  localSpeaking,
  localHand,
  peers,
  speaking,
}) {
  const ids = Object.keys(peers);
  const total = ids.length + 1; // o'zimiz ham

  return (
    <aside className={`participants ${open ? "open" : ""}`}>
      <div className="chat-header">
        <span>👥 Ishtirokchilar ({total})</span>
        <button className="chat-close" onClick={onClose} title="Yopish">
          ✕
        </button>
      </div>
      <div className="pp-list">
        <Row
          name={localName}
          micOn={micOn}
          camOn={camOn}
          speaking={localSpeaking}
          hand={localHand}
          you
        />
        {ids.map((id) => (
          <Row
            key={id}
            name={peers[id].name}
            micOn={peers[id].micOn}
            camOn={peers[id].camOn}
            speaking={Boolean(speaking[id])}
            hand={Boolean(peers[id].hand)}
          />
        ))}
      </div>
    </aside>
  );
}
