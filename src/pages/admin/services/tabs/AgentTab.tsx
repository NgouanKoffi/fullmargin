/// <reference types="vite/client" />

import { useEffect, useMemo, useState } from "react";
import { Card, SectionTitle } from "./SharedComponents";
import {
  HiMiniUsers,
  HiMiniUserCircle,
  HiMiniEnvelope,
  HiMiniSparkles,
} from "react-icons/hi2";
import type { ReactNode } from "react";
import { loadSession } from "../../../../auth/lib/storage";

/* ============================= Types ============================= */
type ServiceDocFromAPI = {
  _id: string;
  name: string;
  email: string;
  description?: string;
  createdAt?: string;
};
type ServiceRow = {
  id: string; // normalisé depuis _id
  name: string;
  email: string;
  description?: string;
  createdAt?: string;
};
type Membership = {
  serviceId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  since?: string;
};
type SummaryRow = {
  serviceId: string;
  name: string;
  email: string;
  count: number;
  last: string | null;
};

/* ============================ API helpers ======================== */

// Base API (prod: https://api.fullmargin.net/api ; dev: /api via proxy Vite)
const API_BASE: string = (import.meta.env?.VITE_API_BASE ?? "/api").toString();

// Join propre (évite les doubles /)
function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = loadSession()?.token || null;

  // Utilise la base API même si `path` commence par /api/...
  const url = /^https?:\/\//i.test(path) ? path : joinUrl(API_BASE, path);

  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      `[${res.status}] ${res.statusText}${txt ? ` — ${txt.slice(0, 160)}` : ""}`
    );
  }

  // Ne tente JSON que si le serveur renvoie du JSON
  const ct = res.headers.get("content-type") || "";
  if (!/json/i.test(ct)) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      `Réponse non-JSON reçue (content-type="${ct}")${
        txt ? ` — ${txt.slice(0, 160)}` : ""
      }`
    );
  }

  return (await res.json()) as T;
}

async function fetchServices(): Promise<{ services: ServiceRow[] }> {
  // Backend doit renvoyer { services } (ou { items })
  const data = await api<{
    services?: ServiceDocFromAPI[];
    items?: ServiceDocFromAPI[];
  }>("admin/services");

  const list: ServiceDocFromAPI[] = Array.isArray(data?.services)
    ? data.services!
    : Array.isArray(data?.items)
    ? data.items!
    : [];

  return {
    services: list.map((s) => ({
      id: s._id,
      name: s.name,
      email: s.email,
      description: s.description,
      createdAt: s.createdAt,
    })),
  };
}

/** Essaie d'utiliser /summary (plus léger). Sinon retombe sur / (liste) et calcule côté client. */
async function fetchMembershipSummary(): Promise<{ rows: SummaryRow[] }> {
  try {
    const data = await api<{ summary?: SummaryRow[] }>(
      "admin/service-memberships/summary"
    );
    if (Array.isArray(data?.summary)) return { rows: data.summary };
  } catch (e) {
    // on retombe sur la liste complète ci-dessous
    console.info(
      "[AgentTab] endpoint summary indisponible, fallback sur la liste:",
      e instanceof Error ? e.message : e
    );
  }

  // Fallback : lire la liste complète puis agréger côté client
  const data2 = await api<{ memberships?: Membership[] }>(
    "admin/service-memberships"
  );
  const mlist = Array.isArray(data2?.memberships) ? data2.memberships : [];
  const map = new Map<string, { count: number; last: string | null }>();
  mlist.forEach((m) => {
    const cur = map.get(m.serviceId) || { count: 0, last: null };
    const lastTs = cur.last ? +new Date(cur.last) : 0;
    const nextTs = m.since ? +new Date(m.since) : 0;
    map.set(m.serviceId, {
      count: cur.count + 1,
      last: nextTs > lastTs ? m.since || cur.last : cur.last,
    });
  });

  const rows: SummaryRow[] = [...map.entries()].map(([serviceId, v]) => ({
    serviceId,
    name: "",
    email: "",
    count: v.count,
    last: v.last || null,
  }));

  return { rows };
}

/* =========================== UI Helpers ========================== */
function Kpi({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-xs">{label}</span>
        <span className="opacity-70">{icon}</span>
      </div>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

/* ============================== Page ============================= */
export function AgentTab() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [{ services }, { rows }] = await Promise.all([
          fetchServices(),
          fetchMembershipSummary(),
        ]);
        if (!cancel) {
          setServices(services || []);
          setSummary(rows || []);
        }
      } catch (e: unknown) {
        if (!cancel)
          setErr(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // Index serviceId -> service
  const svcIdx = useMemo(() => {
    const m = new Map<string, ServiceRow>();
    services.forEach((s) => m.set(s.id, s));
    return m;
  }, [services]);

  // Compose lignes pour le tableau (complète name/email quand summary vient du fallback)
  const rows = useMemo(() => {
    const list = summary.map((r) => {
      const svc = svcIdx.get(r.serviceId);
      return {
        id: r.serviceId,
        name: r.name || svc?.name || "Service manquant",
        email: r.email || svc?.email || "—",
        count: r.count || 0,
        last: r.last || null,
      };
    });
    return list.sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name)
    );
  }, [summary, svcIdx]);

  // KPIs
  const totals = useMemo(() => {
    const totalServices = services.length;
    const servicesWithAgents = new Set(
      rows.filter((r) => r.count > 0).map((r) => r.id)
    );
    const emptyServices = totalServices - servicesWithAgents.size;

    // Estimation (affectations totales)
    const memberships = rows.reduce((acc, r) => acc + r.count, 0);

    return {
      services: totalServices,
      emptyServices: Math.max(emptyServices, 0),
      memberships,
      uniqueAgentsEstimated: "—",
    };
  }, [services.length, rows]);

  const maxCount = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;

  return (
    <div
      id="panel-agent"
      role="tabpanel"
      aria-labelledby="tab-agent"
      className="mt-4 space-y-4"
    >
      <SectionTitle>Agents — Statistiques par service</SectionTitle>

      {err && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 px-4 py-3 text-sm">
          {err}
        </div>
      )}

      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi
            label="Services"
            value={totals.services}
            icon={<HiMiniSparkles className="h-5 w-5 text-indigo-500" />}
          />
          <Kpi
            label="Agents uniques"
            value={totals.uniqueAgentsEstimated}
            icon={<HiMiniUsers className="h-5 w-5 text-emerald-500" />}
          />
          <Kpi
            label="Affectations"
            value={totals.memberships}
            icon={<HiMiniUserCircle className="h-5 w-5 text-slate-500" />}
          />
          <Kpi
            label="Services sans agent"
            value={totals.emptyServices}
            icon={<HiMiniEnvelope className="h-5 w-5 text-amber-500" />}
          />
        </div>
      </Card>

      <Card className="mt-3">
        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={`sk${i}`}
                className="h-14 rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2 pr-3">Service</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3 w-48">Agents</th>
                  <th className="py-2 pr-3">Dernière intégration</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={`row-${r.id}`}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <HiMiniEnvelope className="h-4 w-4 text-indigo-500" />
                        <span className="font-medium">{r.name}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">
                      {r.email}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-indigo-500"
                            style={{ width: `${(r.count / maxCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums">{r.count}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-500">
                      {r.last ? new Date(r.last).toLocaleString("fr-FR") : "—"}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="py-3 text-sm text-slate-500" colSpan={4}>
                      Aucune donnée à afficher.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
