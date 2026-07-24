import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Config Fase 1: dev server + proxy verso il backend FastAPI (Sezione 4 del documento)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  
});
