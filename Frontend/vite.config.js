import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  // ============================================
  // LAN / MOBILE DEVICE TESTING
  // ============================================
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },

  // ============================================
  // PRODUCTION BUILD
  // ============================================
  build: {
    minify: "esbuild",
    cssMinify: true,
    sourcemap: false,

    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
          ],
        },
      },
    },
  },
});