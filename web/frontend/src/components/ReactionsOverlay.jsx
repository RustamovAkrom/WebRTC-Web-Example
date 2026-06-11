// Ekran pastidan yuqoriga suzib chiqadigan emoji reaksiyalar.
// Har bir reaksiya ~4 soniyada o'zi yo'qoladi (useWebRTC hook'ida boshqariladi).

export default function ReactionsOverlay({ reactions }) {
  return (
    <div className="reactions-overlay">
      {reactions.map((r, i) => (
        // chap pozitsiyani ID asosida tarqatamiz (bir joyga to'planmasin)
        <div
          key={r.id}
          className="reaction-float"
          style={{ left: `${10 + ((i * 17) % 80)}%` }}
        >
          <span className="reaction-emoji">{r.emoji}</span>
          <span className="reaction-name">{r.name}</span>
        </div>
      ))}
    </div>
  );
}
