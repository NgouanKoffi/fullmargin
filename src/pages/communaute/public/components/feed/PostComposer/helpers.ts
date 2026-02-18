// src/pages/communaute/private/community-details/tabs/PostComposer/helpers.ts

import { loadSession } from "../../../../../../auth/lib/storage";
import type { ApiStd, SessionShape } from "./types";

export function openAuthModal(mode: "signin" | "signup" = "signin") {
  try {
    const from =
      window.location.pathname + window.location.search + window.location.hash;
    localStorage.setItem("fm:auth:intent", from);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent("fm:open-account", { detail: { mode } })
  );
}

export function isAuthed(): boolean {
  try {
    const s = loadSession() as SessionShape;
    if (!s?.token) return false;
    if (typeof s.expiresAt === "number" && s.expiresAt <= Date.now()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Si pas auth → ouvre auth, sinon exécute l’action */
export function requireAuthThen(
  action?: () => void,
  mode: "signin" | "signup" = "signin"
) {
  if (!isAuthed()) {
    try {
      window.dispatchEvent(new CustomEvent("fm:close-post-composer"));
    } catch {
      /* ignore */
    }
    openAuthModal(mode);
    return false;
  }
  if (action) action();
  return true;
}

export function getAvatarFromSession(s: SessionShape): string {
  if (!s || typeof s !== "object") return "/src/assets/images/favicon.webp";
  const u = s.user;

  const pickFrom = (obj: unknown): string | null => {
    if (!obj || typeof obj !== "object") return null;
    const o = obj as Record<string, unknown>;
    const keys = ["avatarUrl", "photoURL", "photoUrl", "photo", "picture"];
    for (const k of keys) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) return v;
    }
    const prof = o["profile"];
    if (prof && typeof prof === "object") {
      const pv = pickFrom(prof);
      if (pv) return pv;
    }
    return null;
  };

  const fromUser = pickFrom(u);
  if (fromUser) return fromUser;

  const root = s as Record<string, unknown>;
  const rootAvatar =
    root && typeof root.avatarUrl === "string" ? root.avatarUrl : null;

  return (
    rootAvatar ||
    "https://fullmargin-cdn.b-cdn.net/WhatsApp%20Image%202025-12-02%20%C3%A0%2008.45.46_8b1f7d0a.jpg"
  );
}

export async function safeParseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function isApiStd(x: unknown): x is ApiStd {
  return (
    typeof x === "object" &&
    x !== null &&
    ("ok" in (x as Record<string, unknown>) ||
      "error" in (x as Record<string, unknown>))
  );
}
