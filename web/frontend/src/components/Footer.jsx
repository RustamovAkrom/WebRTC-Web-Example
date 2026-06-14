// Footer — minimal sayt footer. Yil dinamik (har yili qo'lda yangilash shart emas).

import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <span>© {year} Meet · WebRTC Video Chat</span>
        <nav className="footer-links">
          <Link to="/">Bosh sahifa</Link>
          <a
            href="https://github.com/RustamovAkrom/WebRTC-Web-Example"
            target="_blank"
            rel="noreferrer noopener"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
