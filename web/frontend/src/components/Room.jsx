import { useWebRTC } from "../hooks/useWebRTC.js";
import VideoGrid from "./VideoGrid.jsx";
import Controls from "./Controls.jsx";

export default function Room({ room, name, onLeave }) {
  const rtc = useWebRTC(room, name);

  const handleLeave = () => {
    rtc.leave();
    onLeave();
  };

  if (rtc.status === "error") {
    return (
      <div className="join">
        <div className="join-card">
          <h1>⚠️ Xatolik</h1>
          <p className="muted">{rtc.error || "Ulanishda muammo yuz berdi."}</p>
          <button onClick={onLeave}>Orqaga</button>
        </div>
      </div>
    );
  }

  return (
    <div className="room">
      <header className="topbar">
        <span className="room-name">Xona: <b>{room}</b></span>
        <span className={`status status-${rtc.status}`}>
          {rtc.status === "live" ? "● Jonli" : "Ulanmoqda…"}
        </span>
      </header>

      {rtc.warning && <div className="banner">⚠️ {rtc.warning}</div>}

      <VideoGrid localStream={rtc.localStream} localName={name} peers={rtc.peers} />

      <Controls
        micOn={rtc.micOn}
        camOn={rtc.camOn}
        sharing={rtc.sharing}
        onToggleMic={rtc.toggleMic}
        onToggleCam={rtc.toggleCam}
        onShareScreen={rtc.shareScreen}
        onLeave={handleLeave}
      />
    </div>
  );
}
