// src/pages/admin/components/admin/users/UsersStats.tsx
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { api, ApiError } from "../../../../../lib/api";
import type {
  Payload,
  Formatter,
} from "recharts/types/component/DefaultTooltipContent";

/* ========= Constantes images ========= */
const DEFAULT_AVATAR =
  "https://fullmargin-cdn.b-cdn.net/WhatsApp%20Image%202025-12-02%20%C3%A0%2008.45.46_8b1f7d0a.jpg";

/* ========= Types ========= */
type TimeseriesPoint = {
  date: string;
  logins: number;
  activeUsers: number;
  durationSec: number;
};

type NewUser = {
  fullName: string;
  email: string;
  avatarUrl: string;
  createdAt?: string;
};

type ConnectedUser = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  status: "online" | "away";
  lastPingAt?: string;
};

type StatsResponse = {
  ok: true;
  range: { from: string; to: string };
  newUsersCount: number;
  newUsers: NewUser[];
  connected: ConnectedUser[];
  disconnected: Array<{
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string;
    endedAt?: string;
    durationSec?: number;
  }>;
  timeseries: TimeseriesPoint[];
};

/* ========= Utils ========= */
const nf = new Intl.NumberFormat("fr-FR");
const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

function safeDate(input?: string | Date | null): string {
  if (!input) return "—";
  const d = new Date(input);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function fmtDurationShort(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h) return `${h} h ${String(m).padStart(2, "0")} min`;
  if (m) return `${m} min ${String(r).padStart(2, "0")} s`;
  return `${r} s`;
}

function toISODate(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

/* Tooltip formatter typé (recharts) */
const tooltipFormatter: Formatter<number, string> = (v, _name, item) => {
  const p = item as Payload<number, string> | undefined;
  const key = String(p?.dataKey ?? "");
  return key === "durationSec"
    ? [fmtDurationShort(Number(v)), "Durée (s)"]
    : [nf.format(Number(v)), "Actifs"];
};

/* ========= Page ========= */
export default function UsersStats() {
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return toISODate(d);
  });
  const [toDate, setToDate] = useState<string>(() => toISODate(new Date()));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);

  type TabView = "online" | "new";
  const [tabView, setTabView] = useState<TabView>("online");

  const dark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  const grid = "rgba(148,163,184,0.25)";
  const axis = "rgba(100,116,139,0.9)";

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const from = `${fromDate}T00:00:00.000Z`;
        const to = `${toDate}T23:59:59.999Z`;

        const r = await api.get<StatsResponse>("/admin/users/stats/overview", {
          query: { from, to }, // objet (QueryRecord)
        });
        if (!cancel) setStats(r);
      } catch (e: unknown) {
        if (cancel) return;
        if (e instanceof ApiError) {
          if (e.status === 401)
            setError("Accès refusé (401). Vérifie ta session.");
          else if (e.status === 403)
            setError("Accès refusé (403). Rôle admin requis.");
          else {
            const msg =
              (typeof e.data === "string" && e.data) ||
              e.message ||
              "Erreur de chargement";
            setError(msg);
          }
        } else {
          const msg = e instanceof Error ? e.message : String(e ?? "Erreur");
          setError(msg || "Erreur de chargement");
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [fromDate, toDate]);

  const ts = useMemo(() => stats?.timeseries ?? [], [stats]);
  const totalLogins = ts.reduce((a, b) => a + (b.logins || 0), 0);
  const totalDuration = ts.reduce((a, b) => a + (b.durationSec || 0), 0);
  const connected = stats?.connected ?? [];
  const connectedCount = connected.length;

  return (
    <main className="w-full px-3 sm:px-6 py-6 sm:py-8 space-y-4">
      {/* Titre + filtres */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <h1 className="text-xl font-semibold">Statistiques utilisateurs</h1>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium uppercase text-slate-500">
            Du
          </label>
          <input
            type="date"
            className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <label className="text-xs font-medium uppercase text-slate-500">
            au
          </label>
          <input
            type="date"
            className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Kpi
          title="Connexions (période)"
          value={nf.format(totalLogins)}
          hint={`${fmtDay(fromDate)} → ${fmtDay(toDate)}`}
          loading={loading}
        />
        <Kpi
          title="Durée cumulée"
          value={fmtDurationShort(totalDuration)}
          hint="sessions"
          loading={loading}
        />
        <Kpi
          title="Utilisateurs connectés maintenant"
          value={nf.format(connectedCount)}
          hint={
            connectedCount === 1
              ? "1 utilisateur"
              : `${connectedCount} utilisateurs`
          }
          loading={loading}
        />
      </section>

      {/* Graphs */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardTitle>Connexions par jour</CardTitle>
          <div className="h-[220px] sm:h-[260px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ts}
                margin={{ top: 6, right: 8, bottom: 2, left: 0 }}
              >
                <CartesianGrid vertical={false} stroke={grid} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => fmtDay(v)}
                  tick={{ fontSize: 12, fill: axis }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => nf.format(v)}
                  tick={{ fontSize: 12, fill: axis }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: dark ? "#0f172a" : "#ffffff",
                    border: `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
                    color: dark ? "#e2e8f0" : "#0f172a",
                    borderRadius: 8,
                  }}
                  formatter={(
                    value: number,
                    name: string
                  ): [string, string] => [nf.format(value), name]}
                  labelFormatter={(l: string) => fmtDay(l)}
                />
                <Bar
                  dataKey="logins"
                  name="Connexions"
                  radius={[6, 6, 0, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Utilisateurs actifs & Durée / jour</CardTitle>
          <div className="h-[220px] sm:h-[260px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={ts}
                margin={{ top: 6, right: 14, bottom: 2, left: 0 }}
              >
                <CartesianGrid vertical={false} stroke={grid} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => fmtDay(v)}
                  tick={{ fontSize: 12, fill: axis }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(v: number) => nf.format(v)}
                  tick={{ fontSize: 12, fill: axis }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(v: number) => fmtDurationShort(v)}
                  tick={{ fontSize: 12, fill: axis }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: dark ? "#0f172a" : "#ffffff",
                    border: `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
                    color: dark ? "#e2e8f0" : "#0f172a",
                    borderRadius: 8,
                  }}
                  formatter={tooltipFormatter}
                  labelFormatter={(l: string) => fmtDay(l)}
                />

                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="activeUsers"
                  name="Actifs"
                  stroke="#6366F1"
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="durationSec"
                  name="Durée (s)"
                  stroke="#06B6D4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* ====== TAB VIEW: Connectés / Nouveaux ====== */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <CardTitle>Utilisateurs</CardTitle>
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-slate-50/60 dark:bg-slate-900/60">
            <button
              type="button"
              onClick={() => setTabView("online")}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm ${
                tabView === "online"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
              }`}
            >
              Connectés maintenant
            </button>
            <button
              type="button"
              onClick={() => setTabView("new")}
              className={`ml-1 px-3 py-1.5 rounded-md text-xs sm:text-sm ${
                tabView === "new"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
              }`}
            >
              Nouveaux utilisateurs
            </button>
          </div>
        </div>

        {/* --- Onglet CONNECTÉS --- */}
        {tabView === "online" && (
          <>
            {connectedCount === 0 ? (
              <p className="text-sm text-slate-500">
                Aucun utilisateur connecté pour le moment.
              </p>
            ) : (
              <>
                <p className="text-sm mb-2">
                  <span className="font-semibold">{connectedCount}</span>{" "}
                  {connectedCount > 1
                    ? "utilisateurs connectés"
                    : "utilisateur connecté"}
                </p>
                <div className="mt-2 max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2 pr-3 text-left">Utilisateur</th>
                        <th className="py-2 pr-3 text-left">Email</th>
                        <th className="py-2 pr-3 text-left">Statut</th>
                        <th className="py-2 pr-3 text-left">Dernier ping</th>
                      </tr>
                    </thead>
                    <tbody>
                      {connected.map((u) => (
                        <tr
                          key={u.id || u.email}
                          className="border-b border-slate-100 dark:border-slate-800"
                        >
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={u.avatarUrl || DEFAULT_AVATAR}
                                alt=""
                                className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                              />
                              <span className="truncate max-w-[220px] sm:max-w-xs">
                                {u.fullName || u.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 pr-3 truncate max-w-[260px]">
                            {u.email}
                          </td>
                          <td className="py-2 pr-3 text-xs capitalize text-slate-600 dark:text-slate-300">
                            {u.status}
                          </td>
                          <td className="py-2 pr-3 text-xs text-slate-500">
                            {safeDate(u.lastPingAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* --- Onglet NOUVEAUX --- */}
        {tabView === "new" && (
          <>
            <p className="text-sm mb-2">
              <span className="font-semibold">
                {nf.format(stats?.newUsersCount || 0)}
              </span>{" "}
              nouveaux utilisateurs sur la période.
            </p>
            {loading ? (
              <div className="h-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ) : (stats?.newUsers?.length ?? 0) === 0 ? (
              <p className="text-sm text-slate-500">
                Aucun nouvel utilisateur sur la période.
              </p>
            ) : (
              <div className="mt-2 max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2 pr-3 text-left">Utilisateur</th>
                      <th className="py-2 pr-3 text-left">Email</th>
                      <th className="py-2 pr-3 text-left">Inscription</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats!.newUsers.map((u) => (
                      <tr
                        key={u.email || `${u.fullName}-${u.createdAt}`}
                        className="border-b border-slate-100 dark:border-slate-800"
                      >
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={u.avatarUrl || DEFAULT_AVATAR}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                            />
                            <span className="truncate max-w-[220px] sm:max-w-xs">
                              {u.fullName || u.email}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 pr-3 truncate max-w-[260px]">
                          {u.email}
                        </td>
                        <td className="py-2 pr-3 text-xs text-slate-500">
                          {safeDate(u.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>
    </main>
  );
}

/* ========= UI mini ========= */
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-medium mb-3 text-slate-600 dark:text-slate-300">
      {children}
    </h3>
  );
}

function Kpi({
  title,
  value,
  hint,
  loading,
}: {
  title: string;
  value: string | number;
  hint?: string;
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
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </Card>
  );
}
