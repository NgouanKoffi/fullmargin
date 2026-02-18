// C:\Users\ADMIN\Desktop\fullmargin-site\src\main.tsx

// === Scripts critiques au chargement ===

// 🔒 Empêche la restauration automatique du scroll par le navigateur
try {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
} catch {
  /* no-op */
}

// 🧠 Gate CSS content-visibility pour éviter de voir le footer trop tôt
document.documentElement.dataset.cv = "off";
requestAnimationFrame(() => {
  const enable = () => {
    document.documentElement.dataset.cv = "on";
  };

  // ✅ Laisse React respirer : active content-visibility en idle si possible
  // (sinon fallback setTimeout)
  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout?: number }) => void)
    | undefined;

  if (typeof ric === "function") ric(enable, { timeout: 1500 });
  else setTimeout(enable, 0);
});

// 🧹 Si retour via le BFCache (back/forward), replacer tout en haut instantanément
window.addEventListener("pageshow", (e) => {
  const ev = e as PageTransitionEvent;
  if (ev.persisted && !location.hash) {
    window.scrollTo(0, 0);
  }
});

// ============================
// === IMPORTS & BOOTSTRAP ===
// ============================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

// ============================
// === PRELOADER SIMPLE    ===
// ============================

/**
 * Loader :
 * - visible tant que l'app n'est pas montée
 * - disparaît quand "fm:app-mounted" est émis (depuis App.tsx)
 * - fallback UX si ça prend trop longtemps
 */
(function runPreloader() {
  const preEl = document.getElementById("fm-preloader");
  const labelEl = document.getElementById("fm-progress");

  if (!(preEl instanceof HTMLElement) || !(labelEl instanceof HTMLElement)) {
    return;
  }

  const pre: HTMLElement = preEl;
  const label: HTMLElement = labelEl;

  let hidden = false;

  label.textContent = "Chargement…";

  function hideNow() {
    if (hidden) return;
    hidden = true;
    pre.classList.add("fm-preloader--hide");
    setTimeout(() => pre.remove(), 180);
  }

  // ✅ UX: si ça dure, proposer reload (ne cache pas le loader tout seul)
  const slowTimer = window.setTimeout(() => {
    label.textContent =
      "Chargement plus long que prévu… (Clique pour recharger)";
    label.style.cursor = "pointer";
    label.onclick = () => location.reload();
  }, 4500);

  window.addEventListener(
    "fm:app-mounted",
    () => {
      clearTimeout(slowTimer);
      hideNow();
    },
    { once: true }
  );
})();

// ⬇️ Démarrage de l'app React
const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
