// src/components/ThemeMode.tsx
import { useEffect, useState } from "react";
import { getTheme, setTheme, type Theme, THEME_EVENT } from "@core/theme";
import { Switch } from "@shared/components/switch";

export default function ThemeMode() {
  const [theme, setLocal] = useState<Theme>(() => getTheme());
  const darkMode = theme === "dark";

  useEffect(() => {
    // 🔄 sync depuis AUTRE onglet
    const onStorage = (e: StorageEvent) => {
      if (e.key === "fm-theme" && (e.newValue === "dark" || e.newValue === "light")) {
        setLocal(e.newValue as Theme);
      }
    };
    // 🔔 sync DANS LE MÊME onglet (mobile ↔ desktop)
    const onThemeEvent = (e: Event) => {
      const t = (e as CustomEvent<Theme>).detail;
      if (t === "dark" || t === "light") setLocal(t);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(THEME_EVENT, onThemeEvent as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(THEME_EVENT, onThemeEvent as EventListener);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={darkMode}
        onCheckedChange={() => {
          const next: Theme = darkMode ? "light" : "dark";
          setLocal(next); // UI instantanée
          setTheme(next); // applique + broadcast
        }}
      />
    </div>
  );
}