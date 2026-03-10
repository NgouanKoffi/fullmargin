// helpers.ts
export const uuid = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

export async function fileToDataUrl(
  file: File,
  maxDim = 1280,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("Lecture du fichier impossible"));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image illisible"));
      img.onload = () => {
        try {
          const { width, height } = img;
          const scale = Math.min(1, maxDim / Math.max(width, height));
          const w = Math.max(1, Math.round(width * scale));
          const h = Math.max(1, Math.round(height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(String(fr.result || ""));
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        } catch {
          resolve(String(fr.result || ""));
        }
      };
      img.src = String(fr.result || "");
    };
    fr.readAsDataURL(file);
  });
}

// petits helpers nombres
export function toDecimalInput(
  raw: string,
  decimals = 2,
  allowNegative = false
): string {
  if (!raw) return "";
  let v = raw.replace(/[^\d.,-]/g, "").replace(",", ".");
  v = allowNegative ? v.replace(/(?!^)-/g, "") : v.replace(/-/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  if (decimals <= 0) return v.split(".")[0] || "";
  const [intPart, fracPart = ""] = v.split(".");
  const frac = fracPart.slice(0, decimals);
  return frac.length ? `${intPart}.${frac}` : intPart || "";
}

export const isZeroish = (s: string) =>
  /^\s*0+(?:([.,])0{0,2})?\s*$/.test(s || "");

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

export function fmt2(n: number | string) {
  const x = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(x)) return "";
  return x.toFixed(2);
}
