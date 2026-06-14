import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Dev rejimida `/ws` (WebSocket), `/api` (REST) va `/health` so'rovlarini backend (uvicorn :8000)
// ga proksi qilamiz — shunda frontend va backend bir xil originda ko'rinadi
// (CORS va cookie SameSite muammolari bo'lmaydi).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/ws": {
        target: "ws://localhost:8000",
        ws: true,
      },
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
