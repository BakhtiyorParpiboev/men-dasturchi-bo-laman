import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { qrcode } from "vite-plugin-qrcode";
// import svgr from "vite-plugin-svgr";
// import sampleImageOptimizer from "vite-plugin-image-optimizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), qrcode()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
  server: {
    port: 3000,
    host: true,
  },

  build: {
    outDir: "dist",
  },
});

