// src/pages/communaute/public/components/feed/modals/comments/commentUtils.ts
export const AVATAR_FALLBACK =
  "https://fullmargin-cdn.b-cdn.net/WhatsApp%20Image%202025-12-02%20%C3%A0%2008.45.46_8b1f7d0a.jpg";

export const getAvatar = (a?: { avatar?: string; avatarUrl?: string }) =>
  (a?.avatar && String(a.avatar)) ||
  (a?.avatarUrl && String(a.avatarUrl)) ||
  AVATAR_FALLBACK;

export function formatRelativeFR(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = Date.now();
  const diff = Math.max(0, now - d.getTime());
  const s = Math.floor(diff / 1000);
  if (s < 10) return "à l’instant";
  if (s < 60) return `il y a ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const dys = Math.floor(h / 24);
  if (dys === 1) return "hier";
  if (dys < 7) return `il y a ${dys} jours`;
  const w = Math.floor(dys / 7);
  if (w < 5) return `il y a ${w} sem.`;
  const mo = Math.floor(dys / 30);
  if (mo < 12) return `il y a ${mo} mois`;
  const y = Math.floor(dys / 365);
  return `il y a ${y} an${y > 1 ? "s" : ""}`;
}

export function uniqueById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of arr) {
    if (!seen.has(it.id)) {
      seen.add(it.id);
      out.push(it);
    }
  }
  return out;
}
