import { useEffect, useRef } from "react";

export default function VideoTile({
  stream,
  name,
  muted = false,
  micOn = true,
  camOn = true,
  speaking = false,
  hand = false,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`tile ${speaking ? "speaking" : ""}`}>
      <video ref={ref} autoPlay playsInline muted={muted} />

      {hand && <div className="tile-hand" title="Qo'l ko'tarilgan">✋</div>}

      {/* Kamera o'chiq bo'lsa — avatar (ism bosh harfi) ko'rsatamiz */}
      {!camOn && (
        <div className="tile-avatar">
          <span>{(name || "?").trim().charAt(0).toUpperCase()}</span>
        </div>
      )}

      <span className="tile-name">
        {!micOn && <span className="mic-off" title="Mikrofon o'chiq">🔇</span>}
        {name}
      </span>
    </div>
  );
}
