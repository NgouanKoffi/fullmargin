// src/auth/AuthContext/presence.ts
import { API_BASE } from "../../lib/api";
import { loadSession } from "../lib/storage";

export const PRESENCE_INTERVAL_MS = 30_000;

export type PresenceKind = "online" | "heartbeat" | "away" | "offline";

export async function postPresence(kind: PresenceKind, keepalive = false) {
  try {
    const s = loadSession();
    if (!s?.token) return;
    await fetch(`${API_BASE}/presence/heartbeat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${s.token}`,
      },
      keepalive,
      body: JSON.stringify({
        kind,
        at: Date.now(),
        visibility:
          typeof document !== "undefined"
            ? document.visibilityState
            : "visible",
        online: typeof navigator !== "undefined" ? navigator.onLine : true,
      }),
    }).catch(() => {});
  } catch (e) {
    if (import.meta.env?.DEV) {
      console.warn("[presence] postPresence failed:", e);
    }
  }
}
