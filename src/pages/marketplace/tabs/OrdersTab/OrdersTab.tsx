// src/pages/marketplace/tabs/OrdersTab/OrdersTab.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import type {
  LicenseInfo,
  PurchaseOrder,
  PurchasesApi,
  PurchasedProduct,
  Subtab,
} from "./types";

import { extractBatchItems, extractProductIdFromBatchItem } from "./batch";
import {
  getFileNameFromDisposition,
  isObjectIdLike,
  readBodySmart,
} from "./helpers";

import FlashBanner from "./components/FlashBanner";
import HeaderFilters from "./components/HeaderFilters";
import SubtabsBar from "./components/SubtabsBar";
import OrdersReceiptsList from "./components/OrdersReceiptsList";
import DownloadsList from "./components/DownloadsList";
import SubscriptionsTab from "./components/SubscriptionsTab";
import { loadSession } from "../../../../auth/lib/storage";
import {
  clearCheckoutIntent,
  grantCheckoutGate,
  setCheckoutIntent,
} from "../../../../router/checkoutGate";
import { API_BASE } from "../../../../lib/api";

export default function OrdersTab() {
  const token = loadSession()?.token;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);

  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const getInitialSubtab = (): Subtab => {
    try {
      const u = new URL(window.location.href);
      const v = (u.searchParams.get("subtab") || "orders").trim();
      if (v === "downloads") return "downloads";
      if (v === "subscriptions") return "subscriptions";
      return "orders";
    } catch {
      return "orders";
    }
  };
  const [subtab, setSubtab] = useState<Subtab>(getInitialSubtab);

  const [prodMap, setProdMap] = useState<Record<string, PurchasedProduct>>({});
  const [prodsLoading, setProdsLoading] = useState(false);

  const [forceReload, setForceReload] = useState(0);
  const [refreshingStripe, setRefreshingStripe] = useState(false);

  // ✅ NEW: refresh crypto NOWPayments
  const [refreshingNowpayments, setRefreshingNowpayments] = useState(false);

  const [downloading, setDownloading] = useState<string>("");

  const [flash, setFlash] = useState<{
    kind: "error" | "info";
    text: string;
  } | null>(null);
  const flashTimer = useRef<number | null>(null);

  function pushFlash(kind: "error" | "info", text: string) {
    setFlash({ kind, text });
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 4500);
  }

  useEffect(() => {
    return () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, []);

  // ✅ Renouvellement : set intent + gate AVANT navigate
  function handleRenewProduct(productId: string) {
    const pid = String(productId || "").trim();
    if (!pid) return;

    clearCheckoutIntent();
    setCheckoutIntent([{ id: pid, qty: 1 }]);
    grantCheckoutGate();

    navigate(
      `/marketplace/checkout?renew=1&product=${encodeURIComponent(pid)}`
    );
  }

  /* ---------- Retour FedaPay ---------- */
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      const provider = u.searchParams.get("provider");
      const status = u.searchParams.get("status");
      if (provider === "fedapay" && status) {
        setForceReload((n) => n + 1);

        u.searchParams.delete("provider");
        u.searchParams.delete("status");
        u.searchParams.delete("tx");
        window.history.replaceState({}, "", u.toString());
      }
    } catch {
      // ignore
    }
  }, []);

  /* ---------- Refresh Stripe ---------- */
  useEffect(() => {
    if (!token) return;
    try {
      const u = new URL(window.location.href);
      const ok = u.searchParams.get("ok");
      const orderId = u.searchParams.get("order") || "";
      const sessionId = u.searchParams.get("session_id") || "";
      if (ok !== "1" || (!orderId && !sessionId)) return;

      setRefreshingStripe(true);
      (async () => {
        try {
          await fetch(`${API_BASE}/payments/refresh`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              orderId: orderId || undefined,
              sessionId: sessionId || undefined,
            }),
          });
        } catch {
          // silencieux
        } finally {
          const clean = new URL(window.location.href);
          clean.searchParams.delete("ok");
          clean.searchParams.delete("order");
          clean.searchParams.delete("session_id");
          window.history.replaceState({}, "", clean.toString());

          setRefreshingStripe(false);
          setForceReload((n) => n + 1);
        }
      })();
    } catch {
      // ignore
    }
  }, [token]);

  /* ---------- ✅ Refresh NOWPayments (crypto) ---------- */
  /* ---------- ✅ Refresh NOWPayments (crypto) ---------- */
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    (async () => {
      try {
        const u = new URL(window.location.href);
        const provider = (u.searchParams.get("provider") || "").trim();
        const status = (u.searchParams.get("status") || "").trim();

        if (provider !== "nowpayments" || !status) return;

        const npId = (
          u.searchParams.get("NP_id") ||
          u.searchParams.get("np_id") ||
          u.searchParams.get("payment_id") ||
          u.searchParams.get("paymentId") ||
          ""
        ).trim();

        if (!npId) return;

        if (!cancelled) setRefreshingNowpayments(true);

        try {
          await fetch(`${API_BASE}/payments/nowpayments/refresh`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ paymentId: npId }),
          });
        } catch {
          // silencieux
        } finally {
          // ✅ PAS DE return ici (sinon ESLint no-unsafe-finally)
          if (!cancelled) {
            const clean = new URL(window.location.href);
            clean.searchParams.delete("provider");
            clean.searchParams.delete("status");
            clean.searchParams.delete("NP_id");
            clean.searchParams.delete("np_id");
            clean.searchParams.delete("payment_id");
            clean.searchParams.delete("paymentId");
            window.history.replaceState({}, "", clean.toString());

            setRefreshingNowpayments(false);
            setForceReload((n) => n + 1);
          }
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  /* ---------- Chargement commandes ---------- */
  useEffect(() => {
    let alive = true;

    async function load() {
      if (!token) {
        setOrders([]);
        return;
      }
      setLoading(true);
      setErr("");

      try {
        const qs = new URLSearchParams({ scope: "purchases" });
        if (from) qs.set("dateFrom", from);
        if (to) qs.set("dateTo", to);

        const url = `${API_BASE}/marketplace/profile/orders?${qs.toString()}`;

        const r = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!r.ok) {
          const body = await readBodySmart(r);
          const j = body.json as Record<string, unknown> | undefined;
          throw new Error(
            (j?.error as string) || body.text || "Chargement impossible"
          );
        }

        const json: PurchasesApi = (await r.json()) as PurchasesApi;
        const items = json?.data?.items ?? [];
        if (!alive) return;

        setOrders(items);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erreur inattendue";
        if (alive) setErr(msg);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [token, from, to, forceReload]);

  /* ---------- Sync param subtab ---------- */
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("subtab", subtab);
      window.history.replaceState({}, "", u.toString());
    } catch {
      // ignore
    }
  }, [subtab]);

  const filtered = useMemo(() => orders, [orders]);

  const titleFromOrders = useMemo(() => {
    const mp: Record<string, string> = {};
    for (const o of filtered) {
      for (const it of o.items || []) {
        const pid = String(it.product || "").trim();
        const t = (it.title || "").trim();
        if (pid && t) mp[pid] = t;
      }
    }
    return mp;
  }, [filtered]);

  const imageFromOrders = useMemo(() => {
    const mp: Record<string, string> = {};
    for (const o of filtered) {
      for (const it of o.items || []) {
        const pid = String(it.product || "").trim();
        const img = (it.imageUrl || "").trim();
        if (pid && img) mp[pid] = img;
      }
    }
    return mp;
  }, [filtered]);

  const purchasedProductIds = useMemo(() => {
    const ids = new Set<string>();
    for (const o of filtered) {
      if (o.status === "succeeded" || o.status === "processing") {
        for (const it of o.items || []) {
          const pid = String(it.product || "").trim();
          if (pid && isObjectIdLike(pid)) ids.add(pid);
        }
      }
    }
    return Array.from(ids);
  }, [filtered]);

  /* ---------- Batch products ---------- */
  useEffect(() => {
    let alive = true;

    async function loadProducts() {
      if (!token || purchasedProductIds.length === 0) {
        setProdMap({});
        return;
      }

      setProdsLoading(true);

      try {
        const url = `${API_BASE}/marketplace/profile/products/batch?ids=${encodeURIComponent(
          purchasedProductIds.join(",")
        )}`;

        const r = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!r.ok) {
          const body = await readBodySmart(r);
          const j = body.json as Record<string, unknown> | undefined;
          throw new Error(
            (j?.error as string) ||
              body.text ||
              "Chargement produits impossible"
          );
        }

        const payload = (await r.json()) as unknown;
        const rawItems = extractBatchItems(payload);

        const m: Record<string, PurchasedProduct> = {};
        for (const p of rawItems ?? []) {
          const pid = extractProductIdFromBatchItem(p);
          if (!pid) continue;

          const obj = p as Record<string, unknown>;
          m[pid] = {
            id: pid,
            title: String(obj?.title ?? "").trim(),
            imageUrl: String(obj?.imageUrl ?? ""),
            fileUrl: String(obj?.fileUrl ?? ""),
            fileName: String(obj?.fileName ?? ""),
            fileMime: String(obj?.fileMime ?? ""),
            license: (obj?.license as LicenseInfo) ?? null,
          };
        }

        // fallback titres/images si batch incomplet
        for (const id of purchasedProductIds) {
          if (!m[id]) {
            m[id] = {
              id,
              title: titleFromOrders[id] || `Produit ${id.slice(-6)}`,
              imageUrl: imageFromOrders[id] || "",
              fileUrl: "",
              fileName: "",
              fileMime: "",
              license: null,
            };
          } else {
            if (!String(m[id].title || "").trim()) {
              m[id].title = titleFromOrders[id] || `Produit ${id.slice(-6)}`;
            }
            if (!String(m[id].imageUrl || "").trim()) {
              m[id].imageUrl = imageFromOrders[id] || "";
            }
          }
        }

        if (alive) setProdMap(m);
      } catch {
        if (alive) {
          const m: Record<string, PurchasedProduct> = {};
          for (const id of purchasedProductIds) {
            m[id] = {
              id,
              title: titleFromOrders[id] || `Produit ${id.slice(-6)}`,
              imageUrl: imageFromOrders[id] || "",
              fileUrl: "",
              fileName: "",
              fileMime: "",
              license: null,
            };
          }
          setProdMap(m);
        }
      } finally {
        if (alive) setProdsLoading(false);
      }
    }

    loadProducts();
    return () => {
      alive = false;
    };
  }, [token, purchasedProductIds, titleFromOrders, imageFromOrders]);

  /* -------- Download -------- */
  async function handleDownloadProduct(
    productId: string,
    suggestedName?: string
  ) {
    if (!token) return;

    setDownloading(productId);
    try {
      const url = `${API_BASE}/marketplace/profile/products/${productId}/download`;
      const r = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!r.ok) {
        const body = await readBodySmart(r);
        const j = body.json as Record<string, unknown> | undefined;
        throw new Error(
          (j?.error as string) || body.text || "Téléchargement impossible"
        );
      }

      const disp = r.headers.get("Content-Disposition");
      const fileName = getFileNameFromDisposition(
        disp,
        suggestedName || "fichier"
      );

      const blob = await r.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);

      pushFlash("info", "Téléchargement démarré.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Téléchargement impossible";
      pushFlash("error", msg);
    } finally {
      setDownloading("");
    }
  }

  if (!token) {
    return (
      <div className="min-w-0">
        <h2 className="text-xl font-bold mb-3">Mes achats</h2>
        <div className="rounded-xl ring-1 ring-black/10 dark:ring-white/10 p-4 bg-white/70 dark:bg-neutral-900/60">
          Connectez-vous pour voir vos achats.
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <HeaderFilters
        from={from}
        to={to}
        setFrom={setFrom}
        setTo={setTo}
        onReset={() => {
          setFrom("");
          setTo("");
        }}
      />

      {refreshingStripe && (
        <div className="mb-3 text-xs rounded-lg px-3 py-2 bg-blue-100 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:ring-blue-900/60">
          Synchronisation du paiement…
        </div>
      )}

      {refreshingNowpayments && (
        <div className="mb-3 text-xs rounded-lg px-3 py-2 bg-amber-100 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-900/25 dark:text-amber-200 dark:ring-amber-900/60">
          Synchronisation du paiement crypto…
        </div>
      )}

      <FlashBanner flash={flash} />

      <SubtabsBar subtab={subtab} setSubtab={setSubtab} />

      {err && (
        <div className="mb-3 rounded-lg px-3 py-2 text-sm bg-rose-100 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-900/60">
          {err}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 min-w-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/40 animate-pulse"
            />
          ))}
        </div>
      ) : subtab === "orders" ? (
        <OrdersReceiptsList orders={filtered} />
      ) : subtab === "downloads" ? (
        <DownloadsList
          purchasedProductIds={purchasedProductIds}
          prodMap={prodMap}
          titleFromOrders={titleFromOrders}
          imageFromOrders={imageFromOrders}
          downloadingId={downloading}
          onDownload={(pid, fileName) => handleDownloadProduct(pid, fileName)}
          onRenew={(pid) => handleRenewProduct(pid)}
          prodsLoading={prodsLoading}
        />
      ) : (
        <SubscriptionsTab
          orders={filtered}
          prodMap={prodMap}
          titleFromOrders={titleFromOrders}
          imageFromOrders={imageFromOrders}
          prodsLoading={prodsLoading}
          onRenew={(pid) => handleRenewProduct(pid)}
        />
      )}
    </div>
  );
}
