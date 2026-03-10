// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@core":     path.resolve(__dirname, "src/core"),
      "@shared":   path.resolve(__dirname, "src/shared"),
      "@features": path.resolve(__dirname, "src/features"),
      "@assets":   path.resolve(__dirname, "src/assets"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5179",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyReq", (_proxyReq, req) => {
            console.log("[proxy→api] ", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log(
              "[api→proxy] ",
              req.method,
              req.url,
              proxyRes.statusCode,
              proxyRes.headers["content-type"]
            );
          });
        },
      },
      "/uploads": {
        target: "http://localhost:5179",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
