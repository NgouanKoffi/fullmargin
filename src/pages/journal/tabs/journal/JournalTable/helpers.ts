// src/pages/journal/tabs/journal/JournalTable/helpers.ts
import type { JournalEntry } from "../../../types";

export function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function toDecimalInput(
  raw: string,
  decimals: number,
  allowNegative: boolean
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

export function fmt2(n: string | number) {
  const v = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(v)) return "";
  return v.toFixed(2);
}

function uniq<T>(arr: T[]): T[] {
  const set = new Set<T>();
  for (const x of arr) set.add(x);
  return Array.from(set);
}

export function getImagesOfEntry(e: JournalEntry): string[] {
  const images: string[] = [];
  const withImages = e as unknown as {
    images?: string[];
    imageUrls?: string[];
    imageDataUrl?: string;
    imageUrl?: string;
  };

  if (Array.isArray(withImages.images)) images.push(...withImages.images);
  if (Array.isArray(withImages.imageUrls)) images.push(...withImages.imageUrls);
  if (withImages.imageDataUrl) images.push(withImages.imageDataUrl);
  if (withImages.imageUrl) images.push(withImages.imageUrl);

  return uniq(images.filter(Boolean)).slice(0, 5);
}
