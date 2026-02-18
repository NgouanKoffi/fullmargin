// coursePlayerUtils.ts
import { loadSession } from "../../../auth/lib/storage";
import type { Session } from "./coursePlayerTypes";

export function authHeaders(): HeadersInit {
  const t = (loadSession() as Session)?.token ?? "";
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function minutes(m?: number) {
  if (!m || m <= 0) return "";
  return `${m} min`;
}
