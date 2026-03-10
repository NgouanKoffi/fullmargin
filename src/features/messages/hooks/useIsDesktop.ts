// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\messages\hooks\useIsDesktop.ts
import { useEffect, useState } from "react";

export function useIsDesktop(breakpoint = 1100) {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(min-width:${breakpoint}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(min-width:${breakpoint}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [breakpoint]);

  return isDesktop;
}
