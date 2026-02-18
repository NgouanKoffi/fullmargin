/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      /* ========= Police par défaut ========= */
      fontFamily: {
        sans: [
          "'IBM Plex Sans'",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Noto Sans",
          "Ubuntu",
          "Cantarell",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },

      /* ========= Couleurs pilotées par tes variables CSS ========= */
      colors: {
        fm: {
          primary: "#6F3CFF",
          primary2: "#8638FF",
        },
        skin: {
          bg: "rgb(var(--bg) / <alpha-value>)",
          header: "rgb(var(--header) / <alpha-value>)",
          surface: "rgb(var(--surface) / <alpha-value>)",
          base: "rgb(var(--text) / <alpha-value>)",
          muted: "rgb(var(--muted) / <alpha-value>)",
          border: "rgb(var(--border) / <alpha-value>)",
          primary: "rgb(var(--primary) / <alpha-value>)",
          accent: "rgb(var(--accent) / <alpha-value>)",
          ring: "rgb(var(--ring) / <alpha-value>)",
          "primary-foreground": "rgb(var(--on-primary) / <alpha-value>)",
          tile: "rgb(var(--tile) / <alpha-value>)",
          "tile-strong": "rgb(var(--tile-strong) / <alpha-value>)",
        },
      },

      /* ========= Ombres / Rayons ========= */
      boxShadow: {
        header: "0 1px 0 0 rgba(0,0,0,.08)",
        headerDark: "0 1px 0 0 rgba(255,255,255,.12)",
        dropdown: "0 20px 60px rgba(0,0,0,.35)",
      },
      borderRadius: { "4xl": "2rem" },

      /* ========= NOUVEAU : Très grands écrans ========= */
      screens: {
        "3xl": "1920px", // FHD large
        "4xl": "2560px", // 2K/QHD
        uw: "3440px", // Ultrawide 21:9
        su: "5120px", // Super-ultrawide 32:9
      },

      /* ========= (Optionnel) max-width tokens si tu ne veux pas 'container' ========= */
      maxWidth: {
        "screen-3xl": "1600px",
        "screen-4xl": "1800px",
        "screen-uw": "2000px",
        "screen-su": "2400px",
      },
    },

    /* ========= (Optionnel mais pratique) classe Tailwind 'container' ========= */
    container: {
      center: true,
      padding: "0.75rem", // ~px-3
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
        "3xl": "1600px", // > 2xl
        "4xl": "1800px",
        uw: "2000px",
        su: "2400px",
      },
    },
  },
  plugins: [],
};
