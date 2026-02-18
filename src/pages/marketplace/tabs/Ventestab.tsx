// src/pages/marketplace/tabs/Ventestab.tsx
import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../../lib/api";
import { loadSession } from "../../../auth/lib/storage";

/* ---------- Types alignés backend (scope=sales) ---------- */
type SaleLine = {
  product: string;
  qty: number;
  unitAmount: number;
  grossAmount: number | null;
  commissionAmount: number | null;
  netAmount: number | null;
  buyer: string;
  shop: string | null;

  // 🆕 promos (si backend les renvoie, sinon null/undefined)
  promoCode?: string | null;
  wasDiscounted?: boolean;
  originalUnitAmount?: number | null;
  finalUnitAmount?: number;
};

type AppliedPromo = { product: string; code: string };

type SaleOrder = {
  id: string;
  status:
    | "requires_payment"
    | "processing"
    | "succeeded"
    | "failed"
    | "refunded"
    | "canceled"
    | string;
  currency: string;
  createdAt?: string | null;
  paidAt?: string | null;
  paymentReference?: string | null;
  receiptUrl?: string | null;
  grossAmount: number;
  commissionAmount: number | null;
  netAmount: number | null;
  items: SaleLine[];

  // 🆕 résumé codes promos au niveau commande
  appliedPromos?: AppliedPromo[];
};

type SalesApi = {
  ok?: boolean;
  data?: {
    scope: "sales";
    items: SaleOrder[];
    stats?: {
      count: number;
      gross: number;
      commission: number;
      net: number;
      byCurrency: Record<
        string,
        { count: number; gross: number; commission: number; net: number }
      >;
    };
  };
};

type PublicProductLiteMini = { id: string; title: string };

/* ---------- Helpers UI ---------- */
const fmtMoney = (v: number, currency = "USD") =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(v);

const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d
      .toLocaleString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replaceAll("\u202f", " ");
  } catch {
    return iso || "—";
  }
};

const statusLabel: Record<string, string> = {
  requires_payment: "En attente",
  processing: "En cours",
  succeeded: "Payée",
  failed: "Échouée",
  refunded: "Remboursée",
  canceled: "Annulée",
};
const statusClasses: Record<string, string> = {
  requires_payment:
    "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-900/60",
  processing:
    "bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-900/60",
  succeeded:
    "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-900/60",
  failed:
    "bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-900/60",
  refunded:
    "bg-purple-100 text-purple-800 ring-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-900/60",
  canceled:
    "bg-neutral-200 text-neutral-800 ring-neutral-300 dark:bg-neutral-800/40 dark:text-neutral-300 dark:ring-neutral-700/60",
};

/* ===================================================== */
export default function Ventestab() {
  const token = loadSession()?.token;

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const [orders, setOrders] = useState<SaleOrder[]>([]);
  const [titleMap, setTitleMap] = useState<Record<string, string>>({}); // productId -> title

  // filtres (en haut)
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  // 🆕 filtres promo
  const [promoMode, setPromoMode] = useState<"all" | "with" | "without">("all");
  const [promoCodeQuery, setPromoCodeQuery] = useState<string>("");

  /* ---------- FETCH ---------- */
  useEffect(() => {
    let alive = true;
    async function load() {
      if (!token) {
        setOrders([]);
        setTitleMap({});
        return;
      }
      setLoading(true);
      setErr("");
      try {
        const qs = new URLSearchParams({ scope: "sales" });
        if (from) qs.set("dateFrom", from);
        if (to) qs.set("dateTo", to);

        const r = await fetch(
          `${API_BASE}/marketplace/profile/orders?${qs.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        );
        if (!r.ok) {
          const msg =
            (await r.text().catch(() => "")) || "Chargement impossible";
          throw new Error(msg);
        }
        const json: SalesApi = await r.json();
        if (!alive) return;

        const rows = json?.data?.items ?? [];
        setOrders(rows);

        // titres produits
        const ids = Array.from(
          new Set(
            rows.flatMap((o) => o.items.map((it) => String(it.product || ""))),
          ),
        ).filter(Boolean);
        if (ids.length) {
          const res = await fetch(
            `${API_BASE}/marketplace/public/products?ids=${encodeURIComponent(
              ids.join(","),
            )}`,
            { cache: "no-store" },
          );
          if (alive && res.ok) {
            const j: { data?: { items?: PublicProductLiteMini[] } } =
              await res.json();
            const map: Record<string, string> = {};
            (j?.data?.items ?? []).forEach((p) => (map[p.id] = p.title));
            setTitleMap(map);
          } else {
            setTitleMap({});
          }
        } else {
          setTitleMap({});
        }
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
  }, [token, from, to]);

  /* ---------- Filtres promo (front) ---------- */
  const normalizedCode = promoCodeQuery.trim().toUpperCase();

  // Un item “promo” si l’un des indicateurs est vrai/présent
  function isItemPromo(it: SaleLine): boolean {
    const used =
      Boolean(it.wasDiscounted) ||
      (typeof it.originalUnitAmount === "number" &&
        it.originalUnitAmount! > (it.finalUnitAmount ?? it.unitAmount)) ||
      Boolean((it.promoCode || "").trim());
    if (!used) return false;
    if (!normalizedCode) return true;
    return (it.promoCode || "").toUpperCase() === normalizedCode;
  }

  // Un order correspond s’il contient au moins un item qui matche le filtre
  const filtered = useMemo(() => {
    if (promoMode === "all" && !normalizedCode) return orders;
    return orders.filter((o) => {
      const items = o.items || [];
      if (promoMode === "with") {
        return items.some((it) => isItemPromo(it));
      }
      if (promoMode === "without") {
        return items.some((it) => !isItemPromo(it));
      }
      // mode all + code => au moins un item avec ce code
      if (normalizedCode) {
        return items.some((it) => isItemPromo(it));
      }
      return true;
    });
  }, [orders, promoMode, normalizedCode]);

  // Stats agrégées (multi devises → affichage par devise)
  const byCurrency = useMemo(() => {
    const map = new Map<
      string,
      { count: number; gross: number; net: number }
    >();
    for (const o of filtered) {
      const c = (o.currency || "USD").toUpperCase();
      const bucket = map.get(c) || { count: 0, gross: 0, net: 0 };
      bucket.count += 1;
      bucket.gross += Number(o.grossAmount || 0);
      bucket.net += Number(o.netAmount || 0);
      map.set(c, bucket);
    }
    return Array.from(map.entries()); // [[currency, {…}]]
  }, [filtered]);

  // 🆕 Stats promo (sur la liste filtrée)
  const promoStats = useMemo(() => {
    let qtyWith = 0;
    let qtyWithout = 0;
    let qtyForCode = 0;

    for (const o of filtered) {
      for (const it of o.items || []) {
        const used = isItemPromo(it);
        if (normalizedCode) {
          if (used) qtyForCode += Math.max(1, Number(it.qty) || 1);
        }
        if (used) qtyWith += Math.max(1, Number(it.qty) || 1);
        else qtyWithout += Math.max(1, Number(it.qty) || 1);
      }
    }
    return { qtyWith, qtyWithout, qtyForCode };
  }, [filtered, normalizedCode]);

  if (!token) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-3">Mes ventes</h2>
        <div className="rounded-xl ring-1 ring-black/10 dark:ring-white/10 p-4 bg-white/70 dark:bg-neutral-900/60">
          Connectez-vous pour voir vos ventes.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Titre + filtres en haut */}
      <div className="flex items-end justify-between gap-3 mb-3 max-[900px]:flex-col max-[900px]:items-start">
        <h2 className="text-xl font-bold">Mes ventes</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="text-sm rounded-lg px-2 py-1 ring-1 ring-black/10 dark:ring-white/10 bg-transparent"
          />
          <span className="opacity-60">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="text-sm rounded-lg px-2 py-1 ring-1 ring-black/10 dark:ring-white/10 bg-transparent"
          />

          {/* 🆕 filtres promo */}
          <select
            value={promoMode}
            onChange={(e) =>
              setPromoMode(e.target.value as "all" | "with" | "without")
            }
            className="text-sm rounded-lg px-2 py-1 ring-1 ring-black/10 dark:ring-white/10 bg-transparent"
            title="Filtrer: tous / avec promo / sans promo"
          >
            <option value="all">Tous</option>
            <option value="with">Avec code promo</option>
            <option value="without">Sans code promo</option>
          </select>
          <input
            type="text"
            placeholder="Code promo (ex: WELCOME10)"
            value={promoCodeQuery}
            onChange={(e) => setPromoCodeQuery(e.target.value)}
            className="text-sm rounded-lg px-2 py-1 ring-1 ring-black/10 dark:ring-white/10 bg-transparent"
          />

          <button
            onClick={() => {
              setFrom("");
              setTo("");
              setPromoMode("all");
              setPromoCodeQuery("");
            }}
            className="text-sm rounded-lg px-3 py-1 ring-1 ring-black/10 dark:ring-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Barre stats (par devise) */}
      <div className="mb-3 rounded-2xl ring-1 ring-black/10 dark:ring-white/10 p-3 bg-white/70 dark:bg-neutral-900/60 text-sm">
        {byCurrency.length === 0 ? (
          <span className="opacity-70">Aucune vente.</span>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {byCurrency.map(([cur, s]) => (
                <span key={cur}>
                  <span className="font-semibold">{s.count}</span> vente
                  {s.count > 1 ? "s" : ""} · Brut{" "}
                  <span className="font-semibold">
                    {fmtMoney(s.gross, cur)}
                  </span>{" "}
                  · Net{" "}
                  <span className="font-semibold">{fmtMoney(s.net, cur)}</span>{" "}
                  ({cur})
                </span>
              ))}
            </div>

            {/* 🆕 stats promo */}
            <div className="text-xs opacity-90">
              Promo : <b>{promoStats.qtyWith}</b> article
              {promoStats.qtyWith > 1 ? "s" : ""} avec code ·{" "}
              <b>{promoStats.qtyWithout}</b> sans code
              {normalizedCode && (
                <>
                  {" "}
                  · Code <b>{normalizedCode}</b> :{" "}
                  <b>{promoStats.qtyForCode}</b> article
                  {promoStats.qtyForCode > 1 ? "s" : ""}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {err && (
        <div className="mb-3 rounded-lg px-3 py-2 text-sm bg-rose-100 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-900/60">
          {err}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/40 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 p-8 text-center bg-white/70 dark:bg-neutral-900/60">
          <div className="text-lg font-semibold mb-1">Aucune vente</div>
          <div className="text-sm opacity-70">Vos ventes apparaîtront ici.</div>
        </div>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((o) => {
            const currency = (o.currency || "USD").toUpperCase();
            const productNames = o.items
              .map(
                (it) =>
                  titleMap[it.product] ||
                  `Produit ${String(it.product).slice(-6)}`,
              )
              .filter(Boolean);

            const codes = Array.from(
              new Set((o.appliedPromos || []).map((ap) => ap.code)),
            );

            return (
              <li
                key={o.id}
                className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 p-4"
              >
                <div className="flex items-start justify-between gap-3 max-[880px]:flex-col max-[880px]:items-start">
                  {/* Col gauche */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">
                        Commande #{o.id.slice(-6)}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full ring-1 ${
                          statusClasses[o.status] || statusClasses.processing
                        }`}
                      >
                        {statusLabel[o.status] || o.status}
                      </span>
                    </div>
                    <div className="text-xs opacity-70 mt-0.5">
                      Créée : {fmtDate(o.createdAt)}{" "}
                      {o.paidAt ? `· Payée : ${fmtDate(o.paidAt)}` : ""}
                    </div>
                    <div className="text-xs mt-0.5">
                      Référence paiement :{" "}
                      <span className="font-medium">
                        {o.paymentReference || "—"}
                      </span>
                    </div>
                    <div className="text-xs mt-1">
                      Produit(s) :{" "}
                      <span className="font-medium">
                        {productNames.join(", ") || "—"}
                      </span>
                    </div>

                    {/* Codes promo listés si présents */}
                    {codes.length > 0 && (
                      <div className="text-[11px] mt-1 opacity-80">
                        Codes promo :{" "}
                        <span className="font-semibold">
                          {codes.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Col droite */}
                  <div className="grid text-right gap-0.5 max-[880px]:text-left shrink-0">
                    <div className="text-xs opacity-70">
                      Brut : {fmtMoney(o.grossAmount || 0, currency)}
                    </div>
                    <div className="text-xs opacity-70">
                      Com. :{" "}
                      {fmtMoney(Number(o.commissionAmount || 0), currency)}
                    </div>
                    <div className="text-sm font-semibold text-emerald-600">
                      Net : {fmtMoney(Number(o.netAmount || 0), currency)}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
