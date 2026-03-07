// src/pages/communaute/private/community-details/tabs/Formations/CoursePlayer/dateUtils.ts
export function formatRelativeFR(dateIso?: string): string | null {
  if (!dateIso) return null;
  const now = Date.now();
  const t = new Date(dateIso).getTime();
  if (Number.isNaN(t)) return null;
  const diff = Math.max(0, now - t);
  const sec = Math.round(diff / 1000);
  if (sec < 5) return "à l'instant";
  if (sec < 60) return `il y a ${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `il y a ${d} j`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `il y a ${mo} mois`;
  const y = Math.round(mo / 12);
  return `il y a ${y} an${y > 1 ? "s" : ""}`;
}
