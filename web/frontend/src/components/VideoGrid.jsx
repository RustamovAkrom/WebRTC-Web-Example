import VideoTile from "./VideoTile.jsx";

export default function VideoGrid({ localStream, localName, peers }) {
  const remoteIds = Object.keys(peers);
  return (
    <div className="grid">
      <VideoTile stream={localStream} name={`${localName} (siz)`} muted />
      {remoteIds.map((id) => (
        <VideoTile key={id} stream={peers[id].stream} name={peers[id].name} />
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
