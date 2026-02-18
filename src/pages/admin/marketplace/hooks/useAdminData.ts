import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminCategory,
  AdminProductItem,
  AdminShopItem,
  ProductQuery,
  PatchProductBody,
  AdminCommissionQuery,
} from "../api/types";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listShops,
  setShopStatus,
  listProducts,
  patchProduct as apiPatchProduct,
  toggleBadge as apiToggleBadge,
  deleteProduct as apiDeleteProduct,
  restoreProduct as apiRestoreProduct,
  listAdminCommissions,
} from "../api/client";

function errMessage(e: unknown, fallback = "Erreur") {
  return e instanceof Error ? e.message : String(e ?? fallback);
}

/* ===================== CATEGORIES ===================== */
export function useAdminCategories() {
  const [items, setItems] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await listCategories();
      if (r.ok) setItems(r.data.items || []);
      else setError(r.error);
    } catch (e: unknown) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = useCallback(
    async (payload: {
      key: string;
      label: string;
      commissionPct?: number;
      featured?: boolean;
    }) => {
      const r = await createCategory(payload);
      if (r.ok) await reload();
      else throw new Error(r.error);
    },
    [reload]
  );

  const update = useCallback(
    async (
      id: string,
      patch: Partial<
        Pick<AdminCategory, "key" | "label" | "commissionPct" | "featured">
      >
    ) => {
      const r = await updateCategory(id, patch);
      if (r.ok) await reload();
      else throw new Error(r.error);
    },
    [reload]
  );

  const remove = useCallback(async (id: string) => {
    const r = await deleteCategory(id);
    if (r.ok) setItems((prev) => prev.filter((c) => c.id !== id));
    else throw new Error(r.error);
  }, []);

  return { items, loading, error, reload, add, update, remove };
}

/* ======================== SHOPS ======================== */
export function useAdminShops() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<AdminShopItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await listShops(q);
      if (r.ok) setItems(r.data.items || []);
      else setError(r.error);
    } catch (e: unknown) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    reload();
  }, [reload]);

  const activate = useCallback(async (id: string) => {
    const r = await setShopStatus(id, "activate");
    if (r.ok)
      setItems((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "active" } : s))
      );
    else throw new Error(r.error);
  }, []);

  const suspend = useCallback(async (id: string) => {
    const r = await setShopStatus(id, "suspend");
    if (r.ok)
      setItems((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "suspended" } : s))
      );
    else throw new Error(r.error);
  }, []);

  return { q, setQ, items, loading, error, reload, activate, suspend };
}

/* ====================== PRODUCTS ======================= */
export function useAdminProducts(initial: ProductQuery = {}) {
  const [params, setParams] = useState<ProductQuery>({
    page: 1,
    pageSize: 25,
    sort: "-updatedAt",
    ...initial,
  });
  const [items, setItems] = useState<AdminProductItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await listProducts(params);
      if (r.ok) {
        setItems(r.data.items || []);
        setPage(r.data.page);
        setPageSize(r.data.pageSize);
        setTotal(r.data.total);
      } else setError(r.error);
    } catch (e: unknown) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    reload();
  }, [reload]);

  const setFilter = useCallback((patch: Partial<ProductQuery>) => {
    setParams((prev) => {
      const next = { ...prev, ...patch };
      if (
        patch.q !== undefined ||
        patch.status !== undefined ||
        patch.shopId !== undefined ||
        patch.categoryKey !== undefined
      ) {
        next.page = 1;
      }
      return next;
    });
  }, []);

  const setPageSafe = useCallback(
    (p: number) => setParams((prev) => ({ ...prev, page: Math.max(1, p) })),
    []
  );

  const setPageSizeSafe = useCallback(
    (ps: number) =>
      setParams((prev) => ({
        ...prev,
        page: 1,
        pageSize: Math.max(1, Math.min(100, ps)),
      })),
    []
  );

  /** Change statut (et ajuste badgeEligible côté client si rejet/suspension) */
  const setStatus = useCallback(async (id: string, status: string) => {
    const r = await apiPatchProduct(id, { status } as PatchProductBody);
    if (r.ok)
      setItems((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status,
                badgeEligible:
                  status === "rejected" || status === "suspended"
                    ? false
                    : p.badgeEligible,
              }
            : p
        )
      );
    else throw new Error(r.error);
  }, []);

  /** PATCH générique utilisé par le modal d’édition */
  const updateProduct = useCallback(
    async (id: string, patch: PatchProductBody) => {
      const r = await apiPatchProduct(id, patch);
      if (r.ok) await reload();
      else throw new Error(r.error);
    },
    [reload]
  );

  const toggleBadge = useCallback(
    async (id: string) => {
      const target = items.find((p) => p.id === id);
      if (
        target &&
        (target.status === "rejected" || target.status === "suspended")
      )
        return;

      const r = await apiToggleBadge(id);
      if (r.ok)
        setItems((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, badgeEligible: r.data.badgeEligible } : p
          )
        );
      else throw new Error(r.error);
    },
    [items]
  );

  const removeProduct = useCallback(async (id: string) => {
    const r = await apiDeleteProduct(id);
    if (r.ok)
      setItems((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, deletedAt: r.data.deletedAt } : p
        )
      );
    else throw new Error(r.error);
  }, []);

  const restoreProduct = useCallback(async (id: string) => {
    const r = await apiRestoreProduct(id);
    if (r.ok)
      setItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, deletedAt: null } : p))
      );
    else throw new Error(r.error);
  }, []);

  const setCategory = useCallback(
    async (id: string, categoryKey: string) => {
      const r = await apiPatchProduct(id, { categoryKey } as PatchProductBody);
      if (!r.ok) throw new Error(r.error);
      await reload();
    },
    [reload]
  );

  const kpi = useMemo(() => {
    const totalProducts = total;
    const validated = items.filter((p) => p.status === "published").length;
    const suspendedProducts = items.filter(
      (p) => p.status === "suspended"
    ).length;
    return { totalProducts, validated, suspendedProducts };
  }, [items, total]);

  return {
    params,
    setFilter,
    setPage: setPageSafe,
    setPageSize: setPageSizeSafe,
    items,
    page,
    pageSize,
    total,
    loading,
    error,
    reload,
    setStatus,
    setCategory,
    updateProduct,
    toggleBadge,
    removeProduct,
    restoreProduct,
    kpi,
  };
}

/* =================== COMMISSIONS ==================== */
export function useAdminCommissions(initial: AdminCommissionQuery = {}) {
  const [params, setParams] = useState<AdminCommissionQuery>({
    page: 1,
    limit: 25,
    sort: "createdAt:desc",
    ...initial,
  });
  const [items, setItems] = useState<
    {
      id: string;
      order: string;
      product: string;
      seller: string;
      buyer: string;
      shop: string | null;
      qty: number;
      currency: string;
      commissionRate: number;
      commissionAmount: number;
      commissionAmountCents: number;
      createdAt?: string;
      updatedAt?: string;
    }[]
  >([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [stats, setStats] = useState<{
    count: number;
    totalCommission: number;
    byCurrency: Record<string, { count: number; totalCommission: number }>;
  }>({ count: 0, totalCommission: 0, byCurrency: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await listAdminCommissions(params);
      if (r.ok) {
        setItems(r.data.items || []);
        setPage(r.data.page);
        setLimit(r.data.limit);
        setTotal(r.data.total);
        setPageCount(r.data.pageCount);
        setStats(r.data.stats);
      } else setError(r.error);
    } catch (e: unknown) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    reload();
  }, [reload]);

  const setFilter = useCallback((patch: Partial<AdminCommissionQuery>) => {
    setParams((prev) => {
      const next = { ...prev, ...patch };
      if (
        patch.q !== undefined ||
        patch.seller !== undefined ||
        patch.buyer !== undefined ||
        patch.product !== undefined ||
        patch.order !== undefined ||
        patch.currency !== undefined ||
        patch.dateFrom !== undefined ||
        patch.dateTo !== undefined
      ) {
        next.page = 1;
      }
      return next;
    });
  }, []);

  const setPageSafe = useCallback(
    (p: number) => setParams((prev) => ({ ...prev, page: Math.max(1, p) })),
    []
  );

  const setLimitSafe = useCallback(
    (l: number) =>
      setParams((prev) => ({
        ...prev,
        page: 1,
        limit: Math.max(1, Math.min(200, l)),
      })),
    []
  );

  return {
    params,
    setFilter,
    setPage: setPageSafe,
    setLimit: setLimitSafe,
    items,
    page,
    limit,
    total,
    pageCount,
    stats,
    loading,
    error,
    reload,
  };
}
