// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\components\feed\hooks\useKey.ts
import { useEffect } from "react";

export default function useKey(
  key: string,
  handler: (e: KeyboardEvent) => void,
  active = true
) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === key.toLowerCase()) handler(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key, handler, active]);
}
