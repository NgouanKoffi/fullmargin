import { useState, useEffect } from "react";

export function useIsMobile(breakpoint: number) {
  const getIsMobile = () =>
    typeof window !== "undefined"
      ? window.matchMedia(`(max-width:${breakpoint - 1}px)`).matches
      : true;

  const [isMobile, setIsMobile] = useState<boolean>(getIsMobile);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width:${breakpoint - 1}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isMobile;
}
