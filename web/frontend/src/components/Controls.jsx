export default function Controls({
  micOn,
  camOn,
  sharing,
  onToggleMic,
  onToggleCam,
  onShareScreen,
  onLeave,
}) {
  return (
    <div className="controls">
      <button className={micOn ? "" : "off"} onClick={onToggleMic}>
        {micOn ? "🎤 Mikrofon" : "🔇 Yoqish"}
      </button>
      <button className={camOn ? "" : "off"} onClick={onToggleCam}>
        {camOn ? "📷 Kamera" : "🚫 Yoqish"}
      </button>
      <button className={sharing ? "active" : ""} onClick={onShareScreen}>
        {sharing ? "🛑 Ulashishni to'xtatish" : "🖥️ Ekran ulashish"}
      </button>
      <button className="leave" onClick={onLeave}>
        📞 Chiqish
      </button>
    </div>
  );
}
