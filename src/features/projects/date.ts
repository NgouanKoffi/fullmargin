export function fmtDateFR(d?: string) {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  }
  export function enRetard(d?: string) {
    if (!d) return false;
    return new Date(d).getTime() < Date.now() - 24 * 60 * 60 * 1000;
  }
  export function imminent(d?: string) {
    if (!d) return false;
    const t = new Date(d).getTime();
    const now = Date.now();
    return t >= now && t - now <= 48 * 60 * 60 * 1000;
  }
  