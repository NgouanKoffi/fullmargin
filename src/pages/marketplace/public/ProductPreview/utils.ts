// src/pages/marketplace/public/ProductPreview/utils.ts
import type { Pricing, PublicProductFull } from "../../lib/publicShopApi";

export function formatPrice(pr: Pricing): string {
  const amount = pr.amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  if (pr.mode === "one_time") return `${amount} $`;
  return `${amount} $ / ${pr.interval === "month" ? "mois" : "an"}`;
}

export function money(n: number): string {
  return (
    n.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }) + " $"
  );
}

export function labelType(t: PublicProductFull["type"]): string {
  switch (t) {
    case "robot_trading":
      return "Robot de trading";
    case "indicator":
      return "Indicateur";
    case "mt4_mt5":
      return "MT4 / MT5";
    case "ebook_pdf":
      return "eBook / PDF";
    case "template_excel":
      return "Template Excel";
    default:
      return t;
  }
}

/** Essaie de transformer un lien YouTube en URL d’embed */
export function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "").trim();
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

export const openAuth = (mode: "signin" | "signup" = "signin") =>
  window.dispatchEvent(
    new CustomEvent("fm:open-account", { detail: { mode } })
  );
