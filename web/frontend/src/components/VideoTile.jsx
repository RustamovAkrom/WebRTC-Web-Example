import { useEffect, useRef, useState } from "react";

export default function VideoTile({
  stream,
  name,
  muted = false,
  micOn = true,
  camOn = true,
  speaking = false,
  hand = false,
  thumb = false,
  spotlit = false,
  onSelect = null,
  hostMenu = null, // [{ label, onClick, danger }] yoki null
}) {
  const ref = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  const cls = [
    "tile",
    thumb ? "tile--thumb" : "",
    spotlit ? "tile--spotlit" : "",
    speaking ? "speaking" : "",
    onSelect ? "tile--selectable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} onClick={onSelect || undefined}>
      <video ref={ref} autoPlay playsInline muted={muted} />

      {hand && (
        <div className="tile-hand" title="Qo'l ko'tarilgan">
          ✋
        </div>
      )}

      {/* Kamera o'chiq bo'lsa — avatar (ism bosh harfi) ko'rsatamiz */}
      {!camOn && (
        <div className="tile-avatar">
          <span>{(name || "?").trim().charAt(0).toUpperCase()}</span>
        </div>
      )}

      {hostMenu && hostMenu.length > 0 && (
        <div className="tile-menu-wrap" onClick={(e) => e.stopPropagation()}>
          <button
            className="tile-menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            title="Moderator amallari"
          >
            ⋮
          </button>
          {menuOpen && (
            <div className="tile-menu">
              {hostMenu.map((item) => (
                <button
                  key={item.label}
                  className={item.danger ? "danger" : ""}
                  onClick={() => {
                    item.onClick();
                    setMenuOpen(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <span className="tile-name">
        {!micOn && (
          <span className="mic-off" title="Mikrofon o'chiq">
            🔇
          </span>
        )}
        {name}
      </span>
    </div>
  );
}
