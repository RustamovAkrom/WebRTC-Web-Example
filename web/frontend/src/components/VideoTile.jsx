import { useEffect, useRef } from "react";

export default function VideoTile({ stream, name, muted = false }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="tile">
      <video ref={ref} autoPlay playsInline muted={muted} />
      <span className="tile-name">{name}</span>
    </div>
  );
}
