// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\Visites.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { loadSession } from "../../auth/lib/storage";
import {
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

/* ========= Types ========= */
type TopPage = { path: string; views: number };
type Summary = {
  totalPageviews: number;
  uniqueVisitors: number;
  consents?: {
    acceptedVisitors: number;
    rejectedVisitors: number;
    undecidedVisitors?: number;
    uniqueVisitors?: number;
  };
};

/* ========= Utils ========= */
const nf = new Intl.NumberFormat("fr-FR");
const fmtNumber = (n: number) => nf.format(Math.max(0, Math.round(n)));
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));
const toISODate = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();

const LABELS: Record<string, string> = {
  "/": "Page d’accueil",
  "/accueil": "Page d’accueil",
  "/profil": "Profil",
  "/tarifs": "Tarifs",
  "/boutiques": "Boutiques",
  "/communautes": "Communautés",
  "/auth/success": "Connexion réussie",
  "/admin": "Admin · Tableau de bord",
  "/admin/visites": "Admin · Visites",
};
const toTitle = (s: string) =>
  s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
function labelizePath(raw: string): string {
  if (!raw || raw === "/") return "Page d’accueil";
  const path = raw.split("?")[0].split("#")[0];
  if (LABELS[path]) return LABELS[path];
  const parts = path.split("/").filter(Boolean);
  if (!parts.length) return "Page d’accueil";
  if (parts[0] === "admin") {
    const rest = parts.slice(1).join(" / ");
    return "Admin · " + (rest ? toTitle(rest) : "Tableau de bord");
  }
  return toTitle(parts.join(" / "));
}

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/* ========= API base & helpers ========= */
const API_BASE: string = (import.meta.env?.VITE_API_BASE ?? "/api").toString();

function isAbsoluteUrl(u: string) {
  return /^https?:\/\//i.test(u);
}
function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
// Autorise "analytics/admin/summary" ou "/api/analytics/admin/summary"
function buildApiUrl(path: string) {
  if (isAbsoluteUrl(path)) return path;
  const trimmed = path.replace(/^\/+/, "");
  const withoutApi = trimmed.startsWith("api/") ? trimmed.slice(4) : trimmed;
  return joinUrl(API_BASE, withoutApi);
}

/* ========= fetch with auth (JSON-safe) ========= */
async function authGetJSON<T>(url: string): Promise<T> {
  const token = loadSession()?.token || null;
  const finalUrl = buildApiUrl(url);

  const res = await fetch(finalUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  if (res.status === 401 || res.status === 403) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || (res.status === 401 ? "unauthorized" : "forbidden"));
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || res.statusText);
  }

  const ct = res.headers.get("content-type") || "";
  if (!/json/i.test(ct)) {
    const peek = await res.text().catch(() => "");
    throw new Error(
      `Réponse non-JSON (content-type="${ct}")${
        peek ? ` — aperçu: ${peek.slice(0, 180)}` : ""
      }`
    );
  }
  return res.json() as Promise<T>;
}

/* ========= count-up tiny hook ========= */
function useCountUp(target: number, duration = 420) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    let start: number | null = null;
    const to = Number.isFinite(target) ? target : 0;
    function step(t: number) {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      setVal(Math.round(to * p));
      if (p < 1) raf.current = requestAnimationFrame(step);
    }
    cancelAnimationFrame(raf.current || 0);
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current || 0);
  }, [target, duration]);
  return val;
}

/* ========= Page ========= */
export default function AdminVisites() {
  const { status } = useAuth();

  // Dates (par défaut 7 derniers jours)
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return toISODate(d).slice(0, 10);
  });
  const [toDate, setToDate] = useState<string>(() =>
    toISODate(new Date()).slice(0, 10)
  );

  // Data states
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryGlobal, setSummaryGlobal] = useState<Summary>({
    totalPageviews: 0,
    uniqueVisitors: 0,
    consents: { acceptedVisitors: 0, rejectedVisitors: 0 },
  });
  const [topPages, setTopPages] = useState<TopPage[]>([]);

  // Charge la data
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setAuthError(null);
      try {
        const f = new Date(`${fromDate}T00:00:00.000Z`);
        const t = new Date(`${toDate}T23:59:59.999Z`);
        const fromISO = (f <= t ? f : t).toISOString();
        const toISO = (t >= f ? t : f).toISOString();

        const q = (obj: Record<string, string>) =>
          "?" + new URLSearchParams(obj).toString();

        const base: Record<string, string> = { from: fromISO, to: toISO };

        const [sG, tp] = await Promise.all([
          authGetJSON<Summary>("analytics/admin/summary" + q(base)),
          authGetJSON<TopPage[]>(
            "analytics/admin/top-pages" + q({ ...base, limit: "50" })
          ),
        ]);

        if (cancelled) return;

        setSummaryGlobal({
          totalPageviews: sG?.totalPageviews ?? 0,
          uniqueVisitors: sG?.uniqueVisitors ?? 0,
          consents: {
            acceptedVisitors: sG?.consents?.acceptedVisitors ?? 0,
            rejectedVisitors: sG?.consents?.rejectedVisitors ?? 0,
          },
        });

        setTopPages(
          tp.map((x) => ({
            path: x.path || "/",
            views: x.views ?? 0,
          }))
        );
      } catch (e: unknown) {
        if (!cancelled) {
          setAuthError(e instanceof Error ? e.message : "Erreur de chargement");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [status, fromDate, toDate]);

  const pvAnim = useCountUp(summaryGlobal.totalPageviews);
  const uvAnim = useCountUp(summaryGlobal.uniqueVisitors);

  const colors = [
    "#6366F1",
    "#06B6D4",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#0EA5E9",
    "#84CC16",
  ];

  // Consent bar chart (ACCEPTÉ / REFUSÉ)
  const c = summaryGlobal.consents || {
    acceptedVisitors: 0,
    rejectedVisitors: 0,
  };
  const consentBars = [
    { name: "Accepté", value: c.acceptedVisitors, fill: "#10B981" },
    { name: "Refusé", value: c.rejectedVisitors, fill: "#EF4444" },
  ];

  // Top pages
  const sortedPages = useMemo(
    () => [...topPages].sort((a, b) => b.views - a.views),
    [topPages]
  );
  const totalViews = useMemo(
    () => sortedPages.reduce((acc, x) => acc + x.views, 0),
    [sortedPages]
  );
  const top10 = useMemo(() => sortedPages.slice(0, 10), [sortedPages]);

  return (
    <div className="container mx-auto w-full overflow-x-hidden px-3 sm:px-4 lg:px-6 py-6 lg:py-8 space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
            Visites & audience
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Synthèse des pages vues, visiteurs uniques et consentements cookies
            sur l’intervalle.
          </p>
        </div>
      </header>

      {/* Filtres (dates uniquement) */}
      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-[auto_1fr_auto_1fr] gap-2 sm:gap-3 items-center">
          <label className="text-xs font-medium uppercase text-slate-500 justify-self-start">
            Du
          </label>
          <input
            type="date"
            className="h-9 w-full min-w-0 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <label className="text-xs font-medium uppercase text-slate-500 justify-self-start">
            au
          </label>
          <input
            type="date"
            className="h-9 w-full min-w-0 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </Card>

      {/* Erreur */}
      {authError && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 px-4 py-3 text-sm">
          {authError.includes("403") || authError.includes("forbidden") ? (
            <>
              Accès refusé (<b>403</b>). Rôle <code>admin</code> requis.
            </>
          ) : (
            <>
              Accès refusé (<b>401</b>). Vérifie ta session.
            </>
          )}
        </div>
      )}

      {/* KPIs */}
      <Section title="Vue globale">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi
            title="Vues totales"
            value={fmtNumber(pvAnim)}
            loading={loading}
          />
          <Kpi
            title="Visiteurs uniques"
            value={fmtNumber(uvAnim)}
            loading={loading}
          />
          <Kpi
            title="Consentement accepté"
            value={fmtNumber(c.acceptedVisitors)}
            loading={loading}
          />
          <Kpi
            title="Consentement refusé"
            value={fmtNumber(c.rejectedVisitors)}
            loading={loading}
          />
        </div>
      </Section>

      {/* === Charts EMPILÉS (plein largeur chacun) === */}
      <div className="space-y-3">
        {/* Consentements (barres) */}
        <Section title="Consentements cookies (visiteurs uniques)">
          <Card>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <div className="w-full h-[340px] sm:h-[380px] xl:h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={consentBars}
                    margin={{ top: 12, right: 16, left: 12, bottom: 12 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(value: number | string, name: string) => [
                        fmtNumber(Number(value)),
                        name,
                      ]}
                    />

                    <Legend verticalAlign="bottom" height={24} />
                    <Bar dataKey="value">
                      {consentBars.map((d, i) => (
                        <Cell key={`cb-${i}`} fill={d.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Section>

        {/* Donut top pages + tableau */}
        <Section title="Pages les plus consultées">
          <Card className="space-y-4">
            {loading ? (
              <ChartSkeleton />
            ) : top10.length === 0 ? (
              <EmptyState label="Aucune page consultée sur la période." />
            ) : (
              <>
                <div className="w-full h-[340px] sm:h-[380px] xl:h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        dataKey="views"
                        data={top10.map((p) => ({
                          name: labelizePath(p.path),
                          views: p.views,
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={2}
                        label={(entry: { name?: string; percent?: number }) =>
                          `${entry.name ?? ""}: ${Math.round(
                            (entry.percent ?? 0) * 100
                          )}%`
                        }
                      >
                        {top10.map((_, i) => (
                          <Cell
                            key={`tp-${i}`}
                            fill={colors[i % colors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmtNumber(v)} />
                      <Legend verticalAlign="bottom" height={24} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Tableau top pages */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 dark:text-slate-400">
                        <th className="py-2 pr-2 font-medium">#</th>
                        <th className="py-2 pr-2 font-medium">Page</th>
                        <th className="py-2 pr-2 font-medium">Vues</th>
                        <th className="py-2 font-medium">Part</th>
                      </tr>
                    </thead>
                    <tbody className="align-middle">
                      {top10.map((p, idx) => {
                        const pct = totalViews
                          ? clamp((p.views / totalViews) * 100, 0, 100)
                          : 0;
                        return (
                          <tr
                            key={p.path + idx}
                            className="border-t border-slate-100 dark:border-slate-800"
                          >
                            <td className="py-2 pr-2 tabular-nums text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="py-2 pr-2">
                              <span
                                className="block max-w-[360px] truncate"
                                title={p.path}
                              >
                                {labelizePath(p.path)}
                              </span>
                            </td>
                            <td className="py-2 pr-2 tabular-nums">
                              {fmtNumber(p.views)}
                            </td>
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-full max-w-[180px] rounded bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full rounded bg-slate-600 dark:bg-slate-300"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="tabular-nums text-slate-600 dark:text-slate-300">
                                  {pct.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </Section>
      </div>
    </div>
  );
}

/* ========= UI ========= */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={classNames(
        "rounded-xl p-4 md:p-5 bg-white/95 dark:bg-slate-900/95",
        "border border-slate-200 dark:border-slate-800 shadow-sm",
        "overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

function Kpi({
  title,
  value,
  loading,
}: {
  title: string;
  value: string | number;
  loading: boolean;
}) {
  return (
    <Card>
      <p className="text-xs text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-1 text-2xl sm:text-3xl font-semibold tabular-nums">
        {loading ? (
          <span className="inline-block h-7 w-28 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        ) : (
          value
        )}
      </p>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <div className="w-full h-[340px] sm:h-[380px] xl:h-[420px]">
      <div className="h-full w-full rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-[140px] text-slate-500 dark:text-slate-400">
      {label}
    </div>
  );
}
