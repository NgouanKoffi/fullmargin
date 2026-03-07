// src/pages/marketplace/tabs/OrdersTab/batch.ts
import type { PurchasedProduct } from "./types";

/* ---------- Batch parsing (ROBUST, no any) ---------- */
export function extractBatchItems(payload: unknown): PurchasedProduct[] {
  const p = payload as Record<string, unknown> | null;
  if (!p) return [];

  const data = (p.data as Record<string, unknown> | null) ?? null;
  const result = (p.result as Record<string, unknown> | null) ?? null;
  const payloadObj = (p.payload as Record<string, unknown> | null) ?? null;

  const a =
    (data?.items as unknown) ??
    (p.items as unknown) ??
    (p.data as unknown) ??
    (result?.items as unknown) ??
    (p.result as unknown) ??
    (payloadObj?.items as unknown) ??
    (p.payload as unknown);

  if (Array.isArray(a)) return a as PurchasedProduct[];
  const aa = a as Record<string, unknown> | null;
  if (aa && Array.isArray(aa.items)) return aa.items as PurchasedProduct[];
  return [];
}

export function extractProductIdFromBatchItem(p: unknown): string {
  const obj = p as Record<string, unknown> | null;
  if (!obj) return "";

  const rawId =
    obj.id ??
    obj._id ??
    obj.productId ??
    (obj.product as Record<string, unknown> | null)?._id ??
    (obj.product as Record<string, unknown> | null)?.id ??
    obj.product ??
    obj.product_id ??
    "";

  if (rawId && typeof rawId === "object") {
    const rid = rawId as Record<string, unknown>;
    const v =
      rid.$oid ??
      rid._id ??
      rid.id ??
      (typeof (rawId as { toString?: unknown })?.toString === "function"
        ? String((rawId as { toString: () => string }).toString())
        : "");
    return String(v || "").trim();
  }
  return String(rawId || "").trim();
}
