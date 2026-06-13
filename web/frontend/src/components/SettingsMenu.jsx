// Sozlamalar menyusi — mavzu, akkaunt va qurilma (kamera/mikrofon) tanlash.

import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export default function SettingsMenu({ open, onClose, devices, onSwitch, onRefresh }) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  if (!open) return null;

  return (
    <>
      {/* tashqariga bosilganda yopilishi uchun fon */}
      <div className="settings-backdrop" onClick={onClose} />
      <div className="settings-menu">
        <div className="settings-row">
          <label>🎨 Mavzu</label>
          <div className="settings-seg">
            {["dark", "light", "system"].map((t) => (
              <button
                key={t}
                className={theme === t ? "active" : ""}
                onClick={() => setTheme(t)}
              >
                {t === "dark" ? "Tungi" : t === "light" ? "Kunduzgi" : "Tizim"}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <label>👤 Akkaunt</label>
          {user ? (
            <button className="settings-refresh" onClick={logout}>
              Chiqish ({user.display_name})
            </button>
          ) : (
            <span className="muted" style={{ fontSize: "0.8rem" }}>
              Mehmon rejimida
            </span>
          )}
        </div>

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
