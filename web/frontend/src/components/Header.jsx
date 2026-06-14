// Header — sayt sarlavhasi: brend, navigatsiya (auth holatiga qarab),
// va mavzu (dark/light) almashtirgich. Landing / auth / lobby sahifalarida
// qayta ishlatiladi.

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { resolved, toggleTheme } = useTheme();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand-logo">
          <span className="brand-mark">◐</span>
          Meet
        </Link>

        <nav className="nav-actions">
          <button
            className="icon-btn"
            onClick={toggleTheme}
            title={resolved === "dark" ? "Yorug' mavzu" : "Qorong'i mavzu"}
            aria-label="Mavzuni almashtirish"
          >
            {resolved === "dark" ? "☀️" : "🌙"}
          </button>

          {user ? (
            <>
              <span className="nav-user">{user.display_name}</span>
              <button className="btn btn-ghost" onClick={logout}>
                Chiqish
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => navigate("/login")}>
                Kirish
              </button>
              <button className="btn btn-primary" onClick={() => navigate("/register")}>
                Ro'yxatdan o'tish
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
