import VideoTile from "./VideoTile.jsx";

// ParticipantStrip — chap tarafdagi thumbnail ro'yxati.
// Bosilganda LOKAL spotlight (faqat o'zingiz uchun). Host bo'lsangiz, har tile'da
// moderator menyusi: hamma uchun spotlight / mute / host qilish / chiqarish.
export default function ParticipantStrip({
  participants,
  spotlightId,
  onSelect,
  isHost,
  hostActions,
}) {
  return (
    <div className="strip">
      {participants.map((p) => {
        let hostMenu = null;
        if (isHost && !p.self) {
          hostMenu = [
            {
              label: "📌 Hamma uchun spotlight",
              onClick: () => hostActions.spotlight(p.id),
            },
            { label: "🔇 Ovozini o'chirish", onClick: () => hostActions.mute(p.id) },
            { label: "👑 Host qilish", onClick: () => hostActions.transfer(p.id) },
            {
              label: "🚫 Xonadan chiqarish",
              onClick: () => hostActions.kick(p.id),
              danger: true,
            },
          ];
        }
        return (
          <div className="strip-item" key={p.id}>
            <VideoTile
              thumb
              stream={p.stream}
              name={p.host ? `👑 ${p.name}` : p.name}
              muted={p.self}
              micOn={p.micOn}
              camOn={p.camOn}
              speaking={p.speaking}
              hand={p.hand}
              spotlit={p.id === spotlightId}
              onSelect={() => onSelect(p.id)}
              hostMenu={hostMenu}
            />
          </div>
        );
      })}
    </div>
  );
}
