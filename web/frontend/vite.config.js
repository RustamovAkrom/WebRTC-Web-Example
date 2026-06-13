import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev rejimida `/ws` (WebSocket) va `/api` (REST) so'rovlarini backend (uvicorn :8000)
// ga proksi qilamiz — shunda frontend va backend bir xil originda ko'rinadi
// (CORS va cookie SameSite muammolari bo'lmaydi).
export default defineConfig({
  plugins: [react()],
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
    },
  },
});
