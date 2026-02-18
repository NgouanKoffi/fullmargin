// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\tabs\dashboard\helpers.ts
import { loadSession } from "../../../../auth/lib/storage";

export const COLORS = {
  indigo: "#6366F1",
  emerald: "#10B981",
  amber: "#F59E0B",
  rose: "#F43F5E",
  slate: "#64748B",
  cyan: "#06B6D4",
  violet: "#8B5CF6",
};

export function authHeaders(): Headers {
  const h = new Headers();
  const s = loadSession();
  if (s?.token) h.set("Authorization", `Bearer ${s.token}`);
  h.set("Cache-Control", "no-store");
  return h;
}

export function fmtUSD(n: number): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    const num = Number(n);
    let out = "0";
    if (Number.isFinite(num)) {
      out = Math.floor(num) === num ? String(num) : num.toFixed(2);
    }
    return `${out} $US`;
  }
}

export function toISOdate(d = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  while (cur <= end) {
    out.push(toISOdate(cur));
    cur = addDays(cur, 1);
  }
  return out;
}

/** Tooltip formatter sans `any` */
export function tooltipFmt(
  v: number | string | Array<number | string>
): string {
  const n = Array.isArray(v)
    ? Number(v[0])
    : typeof v === "number"
    ? v
    : Number(v);
  return Number.isFinite(n) ? fmtUSD(n) : String(v);
}
