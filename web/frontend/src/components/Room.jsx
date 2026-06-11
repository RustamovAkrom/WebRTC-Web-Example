import { useEffect, useState } from "react";
import { useWebRTC } from "../hooks/useWebRTC.js";
import VideoGrid from "./VideoGrid.jsx";
import Controls from "./Controls.jsx";
import ChatPanel from "./ChatPanel.jsx";
import ParticipantsPanel from "./ParticipantsPanel.jsx";
import ReactionsOverlay from "./ReactionsOverlay.jsx";
import SettingsMenu from "./SettingsMenu.jsx";

// Joriy xonaning to'liq taklif havolasi (?room=... bilan).
function inviteLink(room) {
  return `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(
    room
  )}`;
}

function CopyLinkButton({ room }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const link = inviteLink(room);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // clipboard API yo'q (HTTP yoki eski brauzer) — eski usul bilan nusxalaymiz.
      const ta = document.createElement("textarea");
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className="copy-link" onClick={copy} title="Taklif havolasini nusxalash">
      {copied ? "✓ Nusxalandi" : "🔗 Havolani nusxalash"}
    </button>
  );
}

export default function Room({ room, name, onLeave }) {
  const rtc = useWebRTC(room, name);
  const [chatOpen, setChatOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(0); // ko'rilgan xabarlar soni

  // Chat ochiq bo'lsa, kelgan xabarlarni "ko'rilgan" deb belgilaymiz.
  useEffect(() => {
    if (chatOpen) setSeenCount(rtc.messages.length);
  }, [chatOpen, rtc.messages.length]);

  const unread = chatOpen ? 0 : rtc.messages.length - seenCount;

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
        <div className="topbar-right">
          <CopyLinkButton room={room} />
          <button
            className="chat-toggle"
            onClick={() => setPeopleOpen((v) => !v)}
            title="Ishtirokchilar"
          >
            👥 {Object.keys(rtc.peers).length + 1}
          </button>
          <button
            className="chat-toggle"
            onClick={() => setChatOpen((v) => !v)}
            title="Suhbat"
          >
            💬 Suhbat
            {unread > 0 && <span className="chat-badge">{unread}</span>}
          </button>
          <div className="settings-wrap">
            <button
              className="chat-toggle"
              onClick={() => setSettingsOpen((v) => !v)}
              title="Sozlamalar"
            >
              ⚙️
            </button>
            <SettingsMenu
              open={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              devices={rtc.devices}
              onSwitch={rtc.switchDevice}
              onRefresh={rtc.refreshDevices}
            />
          </div>
          <span className={`status status-${rtc.status}`}>
            {rtc.status === "live" ? "● Jonli" : "Ulanmoqda…"}
          </span>
        </div>
      </header>

      {rtc.warning && <div className="banner">⚠️ {rtc.warning}</div>}

      <VideoGrid
        localStream={rtc.localStream}
        localName={name}
        peers={rtc.peers}
        localMicOn={rtc.micOn}
        localCamOn={rtc.camOn}
        localSpeaking={rtc.localSpeaking}
        localHand={rtc.handUp}
        speaking={rtc.speaking}
      />

      <Controls
        micOn={rtc.micOn}
        camOn={rtc.camOn}
        sharing={rtc.sharing}
        handUp={rtc.handUp}
        onToggleMic={rtc.toggleMic}
        onToggleCam={rtc.toggleCam}
        onShareScreen={rtc.shareScreen}
        onToggleHand={rtc.toggleHand}
        onReact={rtc.sendReaction}
        onLeave={handleLeave}
      />

      <ParticipantsPanel
        open={peopleOpen}
        onClose={() => setPeopleOpen(false)}
        localName={name}
        micOn={rtc.micOn}
        camOn={rtc.camOn}
        localSpeaking={rtc.localSpeaking}
        localHand={rtc.handUp}
        peers={rtc.peers}
        speaking={rtc.speaking}
      />

      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={rtc.messages}
        onSend={rtc.sendChat}
      />

      <ReactionsOverlay reactions={rtc.reactions} />
    </div>
  );
}
