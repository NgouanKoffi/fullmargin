// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\journal\utils.ts
import type { Currency } from "./types";
import { findCurrency } from "./types";

/* ---------- Inputs décimaux ---------- */
export function filterDecimal(raw: string, maxDecimals = 4) {
  let v = (raw || "").replace(",", ".");
  v = v.replace(/[^0-9.]/g, "");
  const dp = v.indexOf(".");
  if (dp !== -1) v = v.slice(0, dp + 1) + v.slice(dp + 1).replace(/\./g, "");
  const m = v.match(/^(\d*)(?:\.(\d*))?$/);
  if (!m) return "";
  const int = m[1] || "";
  const dec = (m[2] || "").slice(0, maxDecimals);
  if (v.endsWith(".") && dec === "") return (int || "0") + ".";
  return dec ? `${int || "0"}.${dec}` : int || "";
}

/** entier ou décimal, négatif optionnel, N décimales max */
export function toDecimalInput(
  raw: string,
  decimals = 2,
  allowNegative = false
): string {
  if (!raw) return "";
  let v = raw.replace(/[^\d.,-]/g, "").replace(",", ".");
  if (allowNegative) v = v.replace(/(?!^)-/g, "");
  else v = v.replace(/-/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  const [intPart, fracPart = ""] = v.split(".");
  const frac = fracPart.slice(0, decimals);
  return frac.length ? `${intPart || "0"}.${frac}` : intPart || "";
}

/** calcule % (résultat / investi * 100) formaté avec 2 décimales, négatif possible */
export function computeResultPct(invested: string, resultMoney: string) {
  const inv = parseFloat(String(invested || "0").replace(",", "."));
  const res = parseFloat(String(resultMoney || "0").replace(",", "."));
  if (!isFinite(inv) || inv === 0 || !isFinite(res)) return "";
  const pct = (res / inv) * 100;
  return toDecimalInput(String(pct), 2, true);
}

/* ---------- Format monétaire sûr ---------- */
type CurrencyMeta = {
  code: string;
  serverCode?: string;
  isCrypto?: boolean;
  symbol?: string;
};

function currencyToIntlCode(cur: Currency): {
  code?: string;
  suffix?: string;
  locale: string;
} {
  const c = findCurrency(cur) as CurrencyMeta;

  // mapping UI -> code ISO pour Intl
  let iso: string | undefined = c.serverCode;
  if (!iso) {
    if (c.code === "FCFA") iso = "XOF";
    else if (c.code === "FCFA_BEAC") iso = "XAF";
    else if (!c.isCrypto) iso = String(c.code);
  }

  // locale simple
  const locale =
    iso === "USD"
      ? "en-US"
      : iso === "GBP"
      ? "en-GB"
      : iso === "JPY"
      ? "ja-JP"
      : "fr-FR";

  if (!iso) {
    // crypto : pas de Intl currency -> suffixe symbol
    return { code: undefined, suffix: c.symbol || c.code, locale };
  }
  return { code: iso, suffix: undefined, locale };
}

export function fmtMoney(n: number, cur: Currency) {
  const { code, suffix, locale } = currencyToIntlCode(cur);
  if (code) {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: code,
      }).format(n || 0);
    } catch {
      /* ignore Intl fallback */
    }
  }
  // fallback (cryptos ou inconnues) : 12 345,67 ₿
  const base = (n || 0).toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return suffix ? `${base} ${suffix}` : base;
}

export function cx(...xs: Array<string | null | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/** parse souple “1 234,56” → 1234.56 */
export function n2(v: unknown) {
  return Number(String(v ?? "").replace(",", "."));
}

/** toISOString sans “Invalid Date” */
export function toISO(d: unknown): string {
  try {
    const raw: string | number | Date =
      typeof d === "string" || typeof d === "number" || d instanceof Date
        ? d
        : String(d ?? "");
    const dt = new Date(raw);
    return Number.isNaN(dt.getTime()) ? "" : dt.toISOString();
  } catch {
    return "";
  }
}

/** id court robuste (UUID si dispo) */
export function genId() {
  try {
    if (
      typeof crypto !== "undefined" &&
      "randomUUID" in crypto &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
  } catch {
    /* noop: fallback below */
  }
  return `${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/** échappement HTML minimal pour exports */
export function escapeHtml(s: unknown) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** groupement en morceaux fixes (utile PDF cartes 2×2) */
export function chunk<T>(arr: T[], size: number) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}
