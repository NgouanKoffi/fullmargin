export function uid(): string {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

export function fmtDuration(s?: number) {
  if (!s || !isFinite(s)) return "—";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/**
 * Convertit un File en Data URL (base64) pour persister dans localStorage.
 * ⚠️ Attention au quota (5–10 Mo suivant le navigateur).
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du fichier échouée"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
