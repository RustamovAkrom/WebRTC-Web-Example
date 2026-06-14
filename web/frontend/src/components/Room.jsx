import { useMemo, useState } from "react";
import { useWebRTC } from "../hooks/useWebRTC.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import VideoGrid from "./VideoGrid.jsx";
import SpotlightStage from "./SpotlightStage.jsx";
import ParticipantStrip from "./ParticipantStrip.jsx";
import Controls from "./Controls.jsx";
import ChatPanel from "./ChatPanel.jsx";
import ParticipantsPanel from "./ParticipantsPanel.jsx";
import ReactionsOverlay from "./ReactionsOverlay.jsx";
import SettingsMenu from "./SettingsMenu.jsx";

// Joriy xonaning to'liq taklif havolasi (/room/<id> yo'liga mos).
function inviteLink(room) {
  return `${window.location.origin}/room/${encodeURIComponent(room)}`;
}

function CopyLinkButton({ room }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const link = inviteLink(room);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
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
      {copied ? "✓ Nusxalandi" : "🔗 Havola"}
    </button>
  );
}

export default function Room({ room, name: initialName, onLeave, initialCamOn = true, initialMicOn = true }) {
  const [name, setName] = useState(initialName || "");
  const { getWsTicket, user } = useAuth();
  const { resolved, toggleTheme } = useTheme();
  const rtc = useWebRTC(room, name, getWsTicket, { initialCamOn, initialMicOn });

  const [chatOpen, setChatOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(0);
  const [view, setView] = useState("spotlight"); // "spotlight" | "grid"
  const [localSpotlight, setLocalSpotlight] = useState(null); // faqat o'zim uchun

  // Chat ochiq bo'lsa, kelgan xabarlarni "ko'rilgan" deb belgilaymiz.
  if (chatOpen && seenCount !== rtc.messages.length) {
    setSeenCount(rtc.messages.length);
  }
  const unread = chatOpen ? 0 : rtc.messages.length - seenCount;

  // Barcha ishtirokchilar (o'zim + boshqalar) yagona ro'yxatda.
  const participants = useMemo(() => {
    const self = {
      id: "self",
      self: true,
      name: `${name} (siz)`,
      stream: rtc.localStream,
      micOn: rtc.micOn,
      camOn: rtc.camOn,
      speaking: rtc.localSpeaking,
      hand: rtc.handUp,
      host: rtc.selfPeerId && rtc.hostPeerId === rtc.selfPeerId,
    };
    const others = Object.entries(rtc.peers).map(([id, p]) => ({
      id,
      self: false,
      name: p.name,
      stream: p.stream,
      micOn: p.micOn,
      camOn: p.camOn,
      speaking: Boolean(rtc.speaking[id]),
      hand: Boolean(p.hand),
      host: rtc.hostPeerId === id,
    }));
    return [self, ...others];
  }, [
    name,
    rtc.localStream,
    rtc.micOn,
    rtc.camOn,
    rtc.localSpeaking,
    rtc.handUp,
    rtc.peers,
    rtc.speaking,
    rtc.selfPeerId,
    rtc.hostPeerId,
  ]);

  // peerId'ni ro'yxat ID'siga moslash (o'zim → "self").
  const resolveId = (pid) => (pid && pid === rtc.selfPeerId ? "self" : pid);
  const spotlightId =
    localSpotlight ||
    resolveId(rtc.roomSpotlightPeerId) ||
    resolveId(rtc.hostPeerId) ||
    "self";
  const spotlightParticipant =
    participants.find((p) => p.id === spotlightId) || participants[0];

  const hostActions = {
    spotlight: rtc.hostSpotlight,
    mute: rtc.hostForceMute,
    transfer: rtc.hostTransfer,
    kick: rtc.hostKick,
  };

  const onSelectTile = (id) =>
    setLocalSpotlight((cur) => (cur === id ? null : id));

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

  if (rtc.status === "removed") {
    return (
      <div className="join">
        <div className="join-card">
          <h1>🚪 Xonadan chiqarildingiz</h1>
          <p className="muted">{rtc.removedReason}</p>
          <button onClick={onLeave}>Orqaga</button>
        </div>
      </div>
    );
  }

  return (
    <div className="room">
      <header className="topbar">
        <span className="room-name">
          <span className="brand">◐ Meet</span>
          <span className="room-tag">{room}</span>
          {rtc.locked && <span className="lock-tag" title="Xona qulflangan">🔒</span>}
        </span>
        <div className="topbar-right">
          <CopyLinkButton room={room} />
          <button
            className="chat-toggle"
            onClick={() => setView((v) => (v === "spotlight" ? "grid" : "spotlight"))}
            title="Ko'rinish"
          >
            {view === "spotlight" ? "▦ Grid" : "▭ Spotlight"}
          </button>
          {rtc.isHost && (
            <button
              className={`chat-toggle ${rtc.locked ? "active" : ""}`}
              onClick={() => rtc.hostLock(!rtc.locked)}
              title="Xonani qulflash"
            >
              {rtc.locked ? "🔒 Qulflangan" : "🔓 Qulflash"}
            </button>
          )}
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
            💬
            {unread > 0 && <span className="chat-badge">{unread}</span>}
          </button>
          <button className="chat-toggle" onClick={toggleTheme} title="Mavzu">
            {resolved === "dark" ? "☀️" : "🌙"}
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
      {rtc.forcedMuted && (
        <div className="banner banner-mute">
          🔇 Host ovozingizni o'chirdi. Qayta yoqish uchun mikrofon tugmasini bosing.
        </div>
      )}

      {view === "spotlight" ? (
        <div className="stage-layout">
          <ParticipantStrip
            participants={participants}
            spotlightId={spotlightId}
            onSelect={onSelectTile}
            isHost={rtc.isHost}
            hostActions={hostActions}
          />
          <SpotlightStage participant={spotlightParticipant} />
        </div>
      ) : (
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
      )}

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
