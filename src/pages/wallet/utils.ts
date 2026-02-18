// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\wallet\utils.ts
export function currencySymbol(cur?: string): string {
  const c = (cur || "USD").toUpperCase();
  if (c === "EUR") return "€";
  if (c === "XOF" || c === "FCFA") return "F CFA";
  if (c === "GBP") return "£";
  return "$";
}

export function money(val?: number | null, cur?: string) {
  if (val == null) return "—";
  const s = currencySymbol(cur);
  return `${s}${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.max(0, val))}`;
}
