import type { Product } from "./types";

const LS_KEY = "fm:marketplace:products:v1";

export function loadAllProducts(): Product[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

export function saveProduct(p: Product) {
  const all = loadAllProducts();
  const idx = all.findIndex((x) => x.id === p.id);
  if (idx >= 0) all[idx] = p;
  else all.unshift(p);
  localStorage.setItem(LS_KEY, JSON.stringify(all));
}
