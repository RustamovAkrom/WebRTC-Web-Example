import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev rejimida `/ws` WebSocket so'rovlarini backend (uvicorn :8000) ga proksi qilamiz,
// shunda frontend va backend bir xil originda ko'rinadi (CORS muammosi bo'lmaydi).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/ws": {
        target: "ws://localhost:8000",
        ws: true,
      },
    },
  },
});
