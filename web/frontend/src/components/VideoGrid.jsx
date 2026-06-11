import VideoTile from "./VideoTile.jsx";

export default function VideoGrid({
  localStream,
  localName,
  peers,
  localMicOn = true,
  localCamOn = true,
  localSpeaking = false,
  localHand = false,
  speaking = {},
}) {
  const remoteIds = Object.keys(peers);
  return (
    <div className="grid">
      <VideoTile
        stream={localStream}
        name={`${localName} (siz)`}
        muted
        micOn={localMicOn}
        camOn={localCamOn}
        speaking={localSpeaking}
        hand={localHand}
      />
      {remoteIds.map((id) => (
        <VideoTile
          key={id}
          stream={peers[id].stream}
          name={peers[id].name}
          micOn={peers[id].micOn}
          camOn={peers[id].camOn}
          speaking={Boolean(speaking[id])}
          hand={Boolean(peers[id].hand)}
        />
      ))}
      {remoteIds.length === 0 && (
        <div className="tile placeholder">
          <p>Boshqa ishtirokchilar kutilmoqda…</p>
          <p className="muted">Ushbu xona ID bilan boshqa oyna/qurilmadan kiring.</p>
        </div>
      )}
    </div>
  );
}
