import { useEffect, useMemo, useState, useCallback } from "react";
import {
  RefreshCcw,
  ShieldCheck,
  Clock4,
  XCircle,
  ShieldAlert,
  FileClock,
  Boxes,
  ShoppingCart,
  Download,
  TrendingUp,
  Percent,
  CreditCard,
  CalendarRange,
  Star,
} from "lucide-react";
import { API_BASE } from "../../../lib/api";
import type {
  ProductStatus,
  MyProduct,
  SalesOrder,
  SalesStats,
} from "./dashboard/types";
import {
  COLORS,
  authHeaders,
  addDays,
  eachDay,
  fmtUSD,
  toISOdate,
} from "./dashboard/helpers";
import ChartCard from "./dashboard/ChartCard";
import Kpi from "./dashboard/Kpi";
import MiniStat from "./dashboard/MiniStat";
import {
  AreaGrossChart,
  BarOrdersChart,
  LineDownloadsChart,
  PieStatusesChart,
} from "./dashboard/charts";
import { useNavigate } from "react-router-dom";

/* ===================== Component ===================== */

export default function DashboardHome() {
  // Dates (par défaut 30j)
  const today = toISOdate(new Date());
  const thirtyAgo = toISOdate(addDays(new Date(), -29));

  const [fromDate, setFromDate] = useState(thirtyAgo);
  const [toDate, setToDate] = useState(today);

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<MyProduct[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [stats, setStats] = useState<SalesStats>({
    orders: 0,
    downloads: 0,
    gross: 0,
    commission: 0,
    net: 0,
  });

  const navigate = useNavigate();
  const goToVentes = useCallback(() => {
    const q = new URLSearchParams();
    q.set("tab", "ventes");
    navigate({ search: `?${q.toString()}` });
  }, [navigate]);

  async function load(range?: { from: string; to: string }) {
    setLoading(true);
    try {
      const f = range?.from ?? fromDate;
      const t = range?.to ?? toDate;

      // Produits (privé)
      const pRes = await fetch(`${API_BASE}/marketplace/products`, {
        headers: authHeaders(),
      });
      if (pRes.ok) {
        const pj = (await pRes.json()) as {
          data?: {
            items?: Array<{
              id: string;
              status: ProductStatus;
              ratingAvg?: number;
              ratingCount?: number;
            }>;
          };
        };
        const items: MyProduct[] = (pj?.data?.items ?? []).map((i) => ({
          id: String(i.id),
          status: i.status,
          ratingAvg: Number(i.ratingAvg ?? 0),
          ratingCount: Number(i.ratingCount ?? 0),
        }));
        setProducts(items);
      } else {
        setProducts([]);
      }

      // Ventes (scope=sales sur la plage)
      const qs = new URLSearchParams({
        scope: "sales",
        dateFrom: f,
        dateTo: t,
      }).toString();

      const sRes = await fetch(`${API_BASE}/marketplace/profile/orders?${qs}`, {
        headers: authHeaders(),
      });

      if (sRes.ok) {
        const sj = (await sRes.json()) as {
          data?: {
            items?: Array<{
              id: string;
              createdAt: string;
              grossAmount?: number;
              commissionAmount?: number;
              netAmount?: number;
              items?: Array<{ qty?: number }>;
            }>;
            stats?: { gross: number; commission: number; net: number };
          };
        };

        const source = sj?.data?.items ?? [];
        const normalized: SalesOrder[] = source.map((o) => ({
          id: String(o.id),
          createdAt: o.createdAt,
          ref: null,
          itemsCount: (o.items || []).reduce(
            (s, x) => s + Math.max(1, Number(x.qty || 1)),
            0
          ),
          downloads: (o.items || []).reduce(
            (s, x) => s + Math.max(1, Number(x.qty || 1)),
            0
          ),
          amount: Number(o.grossAmount || 0),
          received:
            typeof o.netAmount === "number" ? Number(o.netAmount) : null,
        }));

        setOrders(normalized);

        const computed: SalesStats = {
          orders: normalized.length,
          downloads: normalized.reduce((a, b) => a + b.downloads, 0),
          gross:
            sj?.data?.stats?.gross ??
            normalized.reduce((a, b) => a + b.amount, 0),
          commission:
            sj?.data?.stats?.commission ??
            source.reduce((a, b) => a + Number(b.commissionAmount || 0), 0),
          net:
            sj?.data?.stats?.net ??
            source.reduce((a, b) => a + Number(b.netAmount || 0), 0),
        };
        setStats(computed);
      } else {
        setOrders([]);
        setStats({ orders: 0, downloads: 0, gross: 0, commission: 0, net: 0 });
      }
    } catch (e) {
      console.error("[DashboardHome] load failed:", e);
      setProducts([]);
      setOrders([]);
      setStats({ orders: 0, downloads: 0, gross: 0, commission: 0, net: 0 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load({ from: fromDate, to: toDate });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyDates() {
    load({ from: fromDate, to: toDate });
  }

  function resetDates() {
    setFromDate(thirtyAgo);
    setToDate(today);
    load({ from: thirtyAgo, to: today });
  }

  const prodCounts = useMemo(() => {
    const c: Record<ProductStatus | "total", number> = {
      draft: 0,
      pending: 0,
      published: 0,
      rejected: 0,
      suspended: 0,
      total: 0,
    };
    for (const p of products) {
      c[p.status] = (c[p.status] || 0) + 1;
      c.total++;
    }
    return c;
  }, [products]);

  // Avis — totaux + moyenne pondérée globale
  const totalReviews = useMemo(
    () => products.reduce((s, p) => s + Number(p.ratingCount || 0), 0),
    [products]
  );

  const globalRating = useMemo(() => {
    let weighted = 0;
    let count = 0;
    for (const p of products) {
      const c = Number(p.ratingCount || 0);
      const a = Number(p.ratingAvg || 0);
      if (c > 0 && Number.isFinite(a)) {
        weighted += a * c;
        count += c;
      }
    }
    return count > 0 ? weighted / count : 0;
  }, [products]);

  // Series quotidiennes pour les graphes
  const daily = useMemo(() => {
    const map: Record<
      string,
      { date: string; orders: number; downloads: number; gross: number }
    > = {};
    for (const d of eachDay(fromDate, toDate)) {
      map[d] = { date: d, orders: 0, downloads: 0, gross: 0 };
    }
    for (const o of orders) {
      const d = toISOdate(new Date(o.createdAt));
      if (!map[d]) map[d] = { date: d, orders: 0, downloads: 0, gross: 0 };
      map[d].orders += 1;
      map[d].downloads += o.downloads;
      map[d].gross += o.amount;
    }
    const arr = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    let cum = 0;
    return arr.map((x) => {
      cum += x.downloads;
      return { ...x, downloadsCum: cum };
    });
  }, [orders, fromDate, toDate]);

  const donutData = useMemo(
    () => [
      { name: "Publiés", value: prodCounts.published, color: COLORS.emerald },
      { name: "En attente", value: prodCounts.pending, color: COLORS.amber },
      { name: "Rejetés", value: prodCounts.rejected, color: COLORS.rose },
      { name: "Suspendus", value: prodCounts.suspended, color: COLORS.slate },
      { name: "Brouillons", value: prodCounts.draft, color: COLORS.violet },
    ],
    [prodCounts]
  );

  return (
    <div className="space-y-8 max-w-screen-2xl mx-auto px-3 sm:px-4">
      {/* ---------- En-tête ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold leading-tight">Tableau de bord</h2>
          <p className="text-sm text-neutral-500">
            Vue d’ensemble : validation, ventes, paiements, avis, actions
            rapides.
          </p>
        </div>

        <button
          onClick={() => load({ from: fromDate, to: toDate })}
          disabled={loading}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-900 ring-1 ring-black/10 dark:ring-white/10 disabled:opacity-50"
        >
          <RefreshCcw className="w-4 h-4" />
          Recharger
        </button>
      </div>

      {/* ---------- Filtres de dates ---------- */}
      <div className="rounded-2xl border bg-white dark:bg-neutral-950 ring-1 ring-black/10 dark:ring-white/10 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarRange className="w-4 h-4 opacity-70" />
          <div className="text-sm font-medium">Filtrer par dates</div>
        </div>

        <div className="min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] gap-3">
          <label className="text-sm min-w-0">
            <span className="block text-neutral-500 mb-1">Du</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full min-w-0 rounded-lg border px-3 py-2 bg-transparent text-sm"
            />
          </label>

          <label className="text-sm min-w-0">
            <span className="block text-neutral-500 mb-1">Au</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full min-w-0 rounded-lg border px-3 py-2 bg-transparent text-sm"
            />
          </label>

          <div className="flex items-end">
            <button
              onClick={applyDates}
              disabled={loading}
              className="w-full sm:w-auto px-3 py-2 rounded-lg border text-sm bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Appliquer
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={resetDates}
              disabled={loading}
              className="w-full sm:w-auto px-3 py-2 rounded-lg border text-sm bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 ring-1 ring-black/10 dark:ring-white/10 disabled:opacity-50"
              title="Réinitialiser la période (30 derniers jours)"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* ---------- MINI KPIs (au-dessus des graphiques) ---------- */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <MiniStat
          icon={<CreditCard className="w-4 h-4" />}
          title="Solde total (net)"
          value={fmtUSD(stats.net)}
          tone="success"
        />
        <MiniStat
          icon={<ShoppingCart className="w-4 h-4" />}
          title="Commandes (total)"
          value={stats.orders}
          onClick={goToVentes}
        />
        <MiniStat
          icon={<Download className="w-4 h-4" />}
          title="Téléchargements"
          value={stats.downloads}
        />
        <MiniStat
          icon={<TrendingUp className="w-4 h-4" />}
          title="Brut"
          value={fmtUSD(stats.gross)}
          tone="indigo"
        />
        <MiniStat
          icon={<Percent className="w-4 h-4" />}
          title="Commission"
          value={fmtUSD(stats.commission)}
        />
        <MiniStat
          icon={<CreditCard className="w-4 h-4" />}
          title="Net estimé"
          value={fmtUSD(stats.net)}
          tone="success"
        />
      </div>

      {/* ---------- Avis (total + note globale) ---------- */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <MiniStat
          icon={<Star className="w-4 h-4" />}
          title="Avis (total)"
          value={totalReviews}
        />
        <MiniStat
          icon={<Star className="w-4 h-4" />}
          title="Note globale"
          value={`${globalRating.toFixed(1)} / 5`}
          tone="indigo"
        />
      </div>

      {/* ---------- KPIs Produits ---------- */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <Kpi
          icon={<ShieldCheck className="w-3.5 h-3.5" />}
          title="Publiés"
          value={prodCounts.published}
          tone="success"
        />
        <Kpi
          icon={<Clock4 className="w-3.5 h-3.5" />}
          title="En attente"
          value={prodCounts.pending}
          tone="warning"
        />
        <Kpi
          icon={<XCircle className="w-3.5 h-3.5" />}
          title="Rejetés"
          value={prodCounts.rejected}
          tone="danger"
        />
        <Kpi
          icon={<ShieldAlert className="w-3.5 h-3.5" />}
          title="Suspendus"
          value={prodCounts.suspended}
          tone="muted"
        />
        <Kpi
          icon={<FileClock className="w-3.5 h-3.5" />}
          title="Brouillons"
          value={prodCounts.draft}
          tone="muted"
        />
        <Kpi
          icon={<Boxes className="w-3.5 h-3.5" />}
          title={"Produits"}
          value={prodCounts.total}
          tone="indigo"
        />
      </div>

      {/* ---------- Graphiques (1 colonne mobile / 2 colonnes ≥ lg) ---------- */}
      <section className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        <ChartCard
          title="Chiffre d’affaires (brut) par jour"
          subtitle={`${fromDate} → ${toDate}`}
        >
          <AreaGrossChart
            data={daily.map((d) => ({ date: d.date, gross: d.gross }))}
          />
        </ChartCard>

        <ChartCard
          title="Commandes par jour"
          subtitle={`${fromDate} → ${toDate}`}
        >
          <BarOrdersChart
            data={daily.map((d) => ({ date: d.date, orders: d.orders }))}
          />
        </ChartCard>

        <ChartCard
          title="Téléchargements cumulés"
          subtitle={`${fromDate} → ${toDate}`}
        >
          <LineDownloadsChart
            data={daily.map((d) => ({
              date: d.date,
              downloadsCum: d.downloadsCum,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Répartition des statuts produits"
          subtitle="Sur l’ensemble de vos produits"
        >
          <PieStatusesChart data={donutData} />
        </ChartCard>
      </section>
    </div>
  );
}
