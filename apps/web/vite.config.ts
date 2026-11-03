import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // En desarrollo, la web habla con la API a través del mismo origen.
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
