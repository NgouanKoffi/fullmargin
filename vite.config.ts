// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
