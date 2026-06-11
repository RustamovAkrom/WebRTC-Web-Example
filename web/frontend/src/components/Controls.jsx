import { useState } from "react";

const EMOJIS = ["👍", "👏", "❤️", "😂", "🎉", "😮"];

export default function Controls({
  micOn,
  camOn,
  sharing,
  handUp,
  onToggleMic,
  onToggleCam,
  onShareScreen,
  onToggleHand,
  onReact,
  onLeave,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const react = (emoji) => {
    onReact(emoji);
    setPickerOpen(false);
  };

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
      <button className={handUp ? "active" : ""} onClick={onToggleHand}>
        {handUp ? "✋ Qo'l ko'tarilgan" : "✋ Qo'l ko'tarish"}
      </button>

      <div className="react-wrap">
        <button onClick={() => setPickerOpen((v) => !v)}>😀 Reaksiya</button>
        {pickerOpen && (
          <div className="react-picker">
            {EMOJIS.map((e) => (
              <button key={e} className="react-emoji" onClick={() => react(e)}>
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      <button className="leave" onClick={onLeave}>
        📞 Chiqish
      </button>
    </div>
  );
}
