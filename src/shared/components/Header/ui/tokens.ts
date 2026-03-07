// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\sections\ui\tokens.ts
import { useEffect, useState } from "react";

/* Tuiles adaptatives clair/sombre */
export const tile =
  "bg-black/5 dark:bg-white/[0.06] text-skin-base ring-1 ring-black/5 dark:ring-white/10 transition-colors";
export const tileHover = "hover:bg-black/10 dark:hover:bg-white/10";

/* 🔥 ÉTAT ACTIF — ajouter aussi les variantes dark pour qu'elles dominent en mode nuit */
export const activeCls = [
  "bg-violet-600", // light
  "dark:bg-violet-600", // dark → garantit le violet aussi la nuit
  "text-white",
  "dark:text-white",
  "ring-2 ring-violet-500",
  "dark:ring-violet-500",
  "transition-colors",
  "hover:bg-violet-700",
  "dark:hover:bg-violet-700",
].join(" ");

/* Hook utilitaire */
export function useIsDesktop(bp = 965) {
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth >= bp : true
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsDesktop(window.innerWidth >= bp);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [bp]);
  return isDesktop;
}
