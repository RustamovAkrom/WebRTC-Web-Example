// Qurilma sozlamalari — kamera va mikrofonni tanlash uchun ochiluvchi menyu.

export default function SettingsMenu({
  open,
  onClose,
  devices,
  onSwitch,
  onRefresh,
}) {
  if (!open) return null;

  return (
    <>
      {/* tashqariga bosilganda yopilishi uchun fon */}
      <div className="settings-backdrop" onClick={onClose} />
      <div className="settings-menu">
        <div className="settings-row">
          <label>📷 Kamera</label>
          <select onChange={(e) => onSwitch("video", e.target.value)}>
            {devices.cameras.length === 0 && <option>Topilmadi</option>}
            {devices.cameras.map((d, i) => (
              <option key={d.deviceId || i} value={d.deviceId}>
                {d.label || `Kamera ${i + 1}`}
              </option>
            ))}
          </select>
        </div>

        <div className="settings-row">
          <label>🎤 Mikrofon</label>
          <select onChange={(e) => onSwitch("audio", e.target.value)}>
            {devices.mics.length === 0 && <option>Topilmadi</option>}
            {devices.mics.map((d, i) => (
              <option key={d.deviceId || i} value={d.deviceId}>
                {d.label || `Mikrofon ${i + 1}`}
              </option>
            ))}
          </select>
        </div>

        <button className="settings-refresh" onClick={onRefresh}>
          🔄 Qurilmalarni yangilash
        </button>
      </div>
    </>
  );
}
