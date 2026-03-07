// src/theme.ts
export type Theme = "light" | "dark";
const STORAGE_KEY = "fm-theme";
export const THEME_EVENT = "fm:theme-change";

// ——— Helpers ———
export function getStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "dark" || v === "light" ? v : null;
  } catch {
    // stockage indisponible (mode privé / SSR)
    return null;
  }
}

export function systemPrefersDark(): boolean {
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
}

export function getTheme(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;

  const fallback: Theme = systemPrefersDark() ? "dark" : "light";
  // On fige ce choix pour éviter toute divergence
  applyTheme(fallback);
  try {
    localStorage.setItem(STORAGE_KEY, fallback);
  } catch {
    // éviter la règle no-empty
    void 0;
  }
  return fallback;
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");

  const meta = document.querySelector(
    'meta[name="theme-color"]'
  ) as HTMLMetaElement | null;
  if (meta) meta.content = theme === "dark" ? "#0b0f14" : "#f8fafc";
}

export function setTheme(theme: Theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    void 0;
  }
  // 🔔 synchronise TOUTES les instances dans le même onglet
  try {
    window.dispatchEvent(
      new CustomEvent<Theme>(THEME_EVENT, { detail: theme })
    );
  } catch {
    void 0;
  }
}

/* optionnel: laissé en place si tu veux réactiver l'animation plus tard */
export function setThemeWithRipple(
  theme: Theme,
  x = window.innerWidth / 2,
  y = window.innerHeight / 2,
  duration = 420
) {
  setTheme(theme);
  // force reflow pour l’anim
  void document.documentElement.offsetWidth;

  // Typage sûr de startViewTransition (API expérimentale)
  type ViewTransition = { ready: Promise<void> };
  type StartViewTransition = (cb: () => void) => ViewTransition;

  const docVT = document as unknown as {
    startViewTransition?: StartViewTransition;
  };
  const startVT = docVT.startViewTransition?.bind(document) as
    | StartViewTransition
    | undefined;
  if (!startVT) return;

  const vt = startVT(() => {});
  const radius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y)
  );

  vt.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${Math.ceil(radius)}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "cubic-bezier(.22,.8,.3,1)",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  });
}
