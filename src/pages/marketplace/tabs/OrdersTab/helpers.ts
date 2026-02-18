// src/pages/marketplace/tabs/OrdersTab/helpers.ts
import { API_BASE } from "../../../../lib/api";
import type { LicenseInfo, PurchaseLine } from "./types";

/* ===================== DEBUG ===================== */
const DEBUG = false;
export function dbg(...args: unknown[]) {
  if (!DEBUG) return;
  console.log(...args);
}

/* ===================== Helpers ===================== */
export const isObjectIdLike = (s: string) =>
  /^[a-fA-F0-9]{24}$/.test(String(s || "").trim());

export const fmtMoney = (v: number, currency = "USD") =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(v);

export const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d
      .toLocaleString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replaceAll("\u202f", " ");
  } catch {
    return iso || "—";
  }
};

export const fmtShortDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d
      .toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
      .replaceAll("\u202f", " ");
  } catch {
    return iso || "—";
  }
};

export const statusLabel: Record<string, string> = {
  requires_payment: "En attente",
  processing: "En cours",
  succeeded: "Payée",
  failed: "Échouée",
  refunded: "Remboursée",
  canceled: "Annulée",
};

export const statusClasses: Record<string, string> = {
  requires_payment:
    "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-900/60",
  processing:
    "bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-900/60",
  succeeded:
    "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-900/60",
  failed:
    "bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-900/60",
  refunded:
    "bg-purple-100 text-purple-800 ring-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-900/60",
  canceled:
    "bg-red-100 text-red-800 ring-red-200 dark:bg-red-900/30 dark:text-red-200 dark:ring-red-900/60",
};

export function resolveUrl(u?: string) {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `${API_BASE}${s.startsWith("/") ? "" : "/"}${s}`;
}

export async function readBodySmart(
  r: Response,
): Promise<{ text: string; json?: unknown }> {
  const ct = (r.headers.get("content-type") || "").toLowerCase();
  const text = await r.text().catch(() => "");
  if (ct.includes("application/json")) {
    try {
      return { text, json: JSON.parse(text || "{}") as unknown };
    } catch {
      return { text };
    }
  }
  return { text };
}

export function getFileNameFromDisposition(
  header: string | null | undefined,
  fallback = "fichier",
): string {
  if (!header) return fallback;
  try {
    const parts = header.split(";").map((s) => s.trim());
    for (const p of parts) {
      const low = p.toLowerCase();
      if (low.startsWith("filename*=")) {
        const v = p.split("=")[1] || "";
        const idx = v.indexOf("''");
        return decodeURIComponent(idx >= 0 ? v.slice(idx + 2) : v);
      }
      if (low.startsWith("filename=")) {
        let v = p.split("=")[1] || "";
        v = v.replace(/^"+|"+$/g, "");
        return v;
      }
    }
  } catch {
    // ignore
  }
  return fallback;
}

export function isLinePromo(it: PurchaseLine): boolean {
  if (it.wasDiscounted) return true;
  if (
    typeof it.originalUnitAmount === "number" &&
    typeof (it.finalUnitAmount ?? it.unitAmount) === "number" &&
    (it.finalUnitAmount ?? it.unitAmount) < it.originalUnitAmount
  )
    return true;
  if ((it.promoCode || "").trim()) return true;
  return false;
}

/* ---------- Licence ---------- */
export function getLicenseBadge(lic?: LicenseInfo | null) {
  if (!lic) return null;

  const kind = String(lic.kind || "")
    .trim()
    .toLowerCase();
  const status = String(lic.status || "")
    .trim()
    .toLowerCase();

  const exp = lic.expiresAt ? new Date(lic.expiresAt).getTime() : null;
  const now = Date.now();
  const isExpired =
    typeof lic.isExpired === "boolean"
      ? lic.isExpired
      : exp != null
        ? exp <= now
        : false;

  const days =
    typeof lic.daysRemaining === "number" && Number.isFinite(lic.daysRemaining)
      ? lic.daysRemaining
      : null;

  if (
    exp == null &&
    (kind === "perpetual" || kind === "" || status === "active")
  ) {
    return {
      label: "Accès illimité",
      classes:
        "bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:ring-sky-900/60",
      hint: "",
    };
  }

  if (status === "revoked") {
    return {
      label: "Accès révoqué",
      classes:
        "bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-900/60",
      hint: "",
    };
  }

  if (isExpired || status === "expired") {
    return {
      label: "Expiré",
      classes:
        "bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-900/60",
      hint: lic.expiresAt ? `Expiré le ${fmtShortDate(lic.expiresAt)}` : "",
    };
  }

  const baseLabel =
    typeof days === "number"
      ? `${days} j restant${days > 1 ? "s" : ""}`
      : "Actif";

  return {
    label: baseLabel,
    classes:
      "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-900/60",
    hint: lic.expiresAt ? `Expire le ${fmtShortDate(lic.expiresAt)}` : "",
  };
}

export function isLicenseExpired(lic?: LicenseInfo | null) {
  if (!lic) return false;
  const status = String(lic.status || "")
    .trim()
    .toLowerCase();
  if (status === "revoked") return false;

  if (typeof lic.isExpired === "boolean") return lic.isExpired;

  if (
    typeof lic.daysRemaining === "number" &&
    Number.isFinite(lic.daysRemaining)
  ) {
    return lic.daysRemaining <= 0;
  }

  if (lic.expiresAt) {
    const exp = new Date(lic.expiresAt).getTime();
    return Number.isFinite(exp) ? exp <= Date.now() : false;
  }

  return status === "expired";
}

export function isSubscriptionLicense(lic?: LicenseInfo | null): boolean {
  const kind = String(lic?.kind || "")
    .trim()
    .toLowerCase();
  return kind === "subscription";
}
