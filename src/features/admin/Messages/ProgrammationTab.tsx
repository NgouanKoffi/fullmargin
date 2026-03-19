// src/pages/admin/Messages/ProgrammationTab.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { loadSession } from "@core/auth/lib/storage";

/* ======================= Types ======================= */
type BroadcastDoc = {
  _id: string;
  subject: string;
  groupIds?: string[];
  toEmails?: string[];
  sendAt?: string | null;
  createdAt?: string;
  status: "scheduled" | "sending" | "done" | "failed" | "cancelled";
  stats?: {
    requested?: number;
    sent?: number;
    failed?: number;
    lastError?: string;
  };
};
type BroadcastDocWithLegacy = BroadcastDoc & { recipientCount?: number };
type BroadcastListResponse = { items?: BroadcastDocWithLegacy[] };

type Row = {
  id: string;
  subject: string;
  groupsCount: number;
  directCount: number;
  totalCount: number;
  sendAt: string | null;
  status: BroadcastDoc["status"];
  lastError?: string;
  createdAt?: string;
};

type GroupInfo = { id: string; name: string; count: number };
type RecipientsDetails = {
  recipients: string[];
  direct: string[];
  groups: GroupInfo[];
};
type RecipientsDetailsResponse = {
  recipients?: string[];
  direct?: string[];
  groups?: GroupInfo[];
};

/* =================== Helpers affichage =================== */
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/* =================== API base & auth =================== */
/** Déclare proprement les globals utilisés (évite any) */
declare global {
  interface Window {
    __API_BASE__?: string;
  }
  interface ImportMetaEnv {
    readonly VITE_API_BASE?: string;
  }
}

function apiBaseFromWindow(): string | null {
  if (typeof window === "undefined") return null;
  return typeof window.__API_BASE__ === "string" && window.__API_BASE__
    ? window.__API_BASE__
    : null;
}
function apiBaseFromEnv(): string | null {
  try {
    const v = (import.meta as ImportMeta).env?.VITE_API_BASE;
    return typeof v === "string" && v ? v : null;
  } catch {
    return null;
  }
}

/** Base API configurable : window.__API_BASE__ > VITE_API_BASE > '/api' */
const API_BASE: string = apiBaseFromWindow() || apiBaseFromEnv() || "/api";

/** Join sûr qui évite les doublons `/api/api/...` et gère les URLs absolues. */
function joinApi(base: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path; // déjà absolu
  const b = String(base || "").replace(/\/+$/, "");
  const p0 = String(path || "").replace(/^\/+/, "");
  const p = b.endsWith("/api") && p0.startsWith("api/") ? p0.slice(4) : p0;
  return `${b}/${p}`;
}

function getToken(): string | null {
  try {
    return loadSession()?.token || null;
  } catch {
    return null;
  }
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getToken();
  const base: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  return { ...base, ...(extra || {}) };
}

async function fetchJSONAuth<T>(url: string, init?: RequestInit): Promise<T> {
  const fullUrl = joinApi(API_BASE, url);
  const res = await fetch(fullUrl, {
    credentials: "include",
    ...init,
    headers: authHeaders({
      Accept: "application/json",
      ...(init?.headers || {}),
    }),
  });

  const ct = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) {
    // HTML fréquent si 401/302 vers page de login ou fallback SPA
    const extract = ct.includes("json") ? text : (text || "").slice(0, 200);
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${extract}`);
  }

  if (ct.includes("application/json")) {
    try {
      return JSON.parse(text) as T;
    } catch (e) {
      throw new Error(`Réponse JSON invalide: ${(e as Error)?.message || e}`);
    }
  }

  // certains backends oublient le header → on tente JSON quand même
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Réponse non-JSON (${ct || "type inconnu"}). Extrait: ${(
        text || ""
      ).slice(0, 120)}`
    );
  }
}

/* ======================= UI bits ======================= */
function StatusBadge({ status }: { status: Row["status"] }) {
  if (status === "scheduled") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-200">
        <Clock className="w-3 h-3" /> Programmé
      </span>
    );
  }
  if (status === "sending") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-200">
        <Clock className="w-3 h-3 animate-pulse" /> Envoi en cours
      </span>
    );
  }
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="w-3 h-3" /> Envoyé
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 ring-1 ring-rose-200">
        <XCircle className="w-3 h-3" /> Échec
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 ring-1 ring-slate-200">
        <XCircle className="w-3 h-3" /> Annulé
      </span>
    );
  }
  return null;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition",
        "ring-1 ring-skin-border/30",
        active
          ? "bg-[#7c3aed] text-white shadow-sm"
          : "bg-skin-surface hover:bg-skin-tile text-skin-base",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ===================== Composant principal ===================== */
export default function ProgrammationTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  // déroulé + détails
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [details, setDetails] = useState<
    Record<string, { loading: boolean; data?: RecipientsDetails }>
  >({});

  // filtre par statut
  const [filter, setFilter] = useState<null | Row["status"]>(null);

  const counts = useMemo(() => {
    const c = {
      scheduled: 0,
      sending: 0,
      done: 0,
      failed: 0,
      cancelled: 0,
    } as Record<Row["status"], number>;
    for (const r of rows) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [rows]);

  const filtered = useMemo(
    () => (filter ? rows.filter((r) => r.status === filter) : rows),
    [rows, filter]
  );

  const upcoming = useMemo(
    () =>
      filtered.slice().sort((a, b) => {
        const aa = a.sendAt ? +new Date(a.sendAt) : +new Date(a.createdAt || 0);
        const bb = b.sendAt ? +new Date(b.sendAt) : +new Date(b.createdAt || 0);
        return aa - bb;
      }),
    [filtered]
  );

  async function refresh() {
    setLoading(true);
    try {
      const data = await fetchJSONAuth<BroadcastListResponse>(
        `/api/admin/mailer/broadcasts?limit=200`
      );
      const list: BroadcastDocWithLegacy[] = Array.isArray(data.items)
        ? data.items
        : [];

      const normalized: Row[] = list.map((d) => {
        const groupsCount = d.groupIds?.length ?? 0;
        const directCount = d.toEmails?.length ?? 0;
        const totalCount =
          d.stats?.requested ?? d.recipientCount ?? groupsCount + directCount;

        return {
          id: d._id,
          subject: d.subject || "(Sans objet)",
          groupsCount,
          directCount,
          totalCount,
          sendAt: d.sendAt ?? null,
          status: d.status,
          lastError: d.stats?.lastError,
          createdAt: d.createdAt,
        };
      });
      setRows(normalized);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[ProgrammationTab] fetch error:", msg);
      setRows([]);
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function cancel(id: string) {
    try {
      await fetchJSONAuth(
        `/api/admin/mailer/broadcasts/${encodeURIComponent(id)}/cancel`,
        { method: "PATCH" }
      );
      setRows((arr) =>
        arr.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r))
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[ProgrammationTab] cancel failed:", msg);
    }
  }

  async function toggleRow(id: string) {
    setOpen((o) => ({ ...o, [id]: !o[id] }));
    if (!open[id] && !details[id]) {
      setDetails((d) => ({ ...d, [id]: { loading: true } }));
      try {
        const data = await fetchJSONAuth<RecipientsDetailsResponse>(
          `/api/admin/mailer/broadcasts/${encodeURIComponent(id)}/recipients`
        );
        const payload: RecipientsDetails = {
          recipients: Array.isArray(data.recipients) ? data.recipients : [],
          direct: Array.isArray(data.direct) ? data.direct : [],
          groups: Array.isArray(data.groups) ? data.groups : [],
        };
        setDetails((d) => ({ ...d, [id]: { loading: false, data: payload } }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("[ProgrammationTab] load recipients failed:", msg);
        setDetails((d) => ({
          ...d,
          [id]: {
            loading: false,
            data: { recipients: [], direct: [], groups: [] },
          },
        }));
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Header en 3 lignes sur mobile */}
      <div className="space-y-2">
        {/* Ligne 1 : icône + titre (+ actions desktop à droite) */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-xl p-2 ring-1 ring-skin-border/20 bg-skin-surface">
            <CalendarClock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold">Programmation</h2>

          {/* Actions à droite en ≥sm */}
          <div className="ml-auto hidden sm:flex items-center gap-2">
            {filter && (
              <button
                onClick={() => setFilter(null)}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 ring-skin-border/20 hover:bg-skin-tile"
                title="Réinitialiser le filtre"
              >
                Tout afficher
              </button>
            )}
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-skin-border/20 hover:bg-skin-tile text-sm"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              {firstLoad ? "Chargement…" : "Rafraîchir"}
            </button>
          </div>
        </div>

        {/* Ligne 2 : description seule */}
        <p className="text-skin-muted text-sm">
          Suis et gère les envois d’emails programmés (newsletter, annonces,
          etc.).
        </p>

        {/* Ligne 3 : actions en mobile */}
        <div className="sm:hidden grid grid-cols-2 gap-2">
          {filter && (
            <button
              onClick={() => setFilter(null)}
              className="rounded-xl px-3 py-2 text-sm ring-1 ring-skin-border/20 bg-skin-surface hover:bg-skin-tile"
            >
              Tout afficher
            </button>
          )}
          <button
            onClick={refresh}
            className="rounded-xl px-3 py-2 text-sm ring-1 ring-skin-border/20 bg-skin-surface hover:bg-skin-tile col-span-2"
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              {firstLoad ? "Chargement…" : "Rafraîchir"}
            </span>
          </button>
        </div>
      </div>

      {/* Chips filtre */}
      <div className="flex flex-wrap gap-2">
        <Chip active={filter === null} onClick={() => setFilter(null)}>
          {rows.length} total
        </Chip>
        <Chip
          active={filter === "scheduled"}
          onClick={() => setFilter("scheduled")}
        >
          {counts.scheduled} programmés
        </Chip>
        <Chip
          active={filter === "sending"}
          onClick={() => setFilter("sending")}
        >
          {counts.sending} en cours
        </Chip>
        <Chip active={filter === "done"} onClick={() => setFilter("done")}>
          {counts.done} envoyés
        </Chip>
        <Chip active={filter === "failed"} onClick={() => setFilter("failed")}>
          {counts.failed} échecs
        </Chip>
      </div>

      {/* Liste */}
      <div className="rounded-xl sm:rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface shadow-sm">
        {upcoming.length === 0 ? (
          <div className="p-6 text-sm text-skin-muted">
            {firstLoad ? "Chargement…" : "Aucun envoi trouvé."}
          </div>
        ) : (
          <ul className="divide-y divide-skin-border/10 border-t border-skin-border/10">
            {upcoming.map((m) => {
              const isOpen = !!open[m.id];
              const info = details[m.id];
              const recips = info?.data?.recipients ?? [];

              return (
                <li key={m.id} className="p-3 sm:px-4 sm:py-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleRow(m.id)}
                      className="mt-0.5 rounded p-1 hover:bg-black/5 dark:hover:bg-white/10"
                      aria-label={isOpen ? "Replier" : "Dérouler"}
                      title={isOpen ? "Replier" : "Dérouler"}
                    >
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div className="mt-1 shrink-0">
                      <Clock className="w-4 h-4 opacity-60" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <div className="font-medium truncate">{m.subject}</div>
                        <span className="sm:ml-auto text-xs text-skin-muted tabular-nums">
                          {m.sendAt
                            ? fmtDate(m.sendAt)
                            : m.createdAt
                            ? fmtDate(m.createdAt)
                            : "-"}
                        </span>
                      </div>

                      <div className="text-xs text-skin-muted mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          {m.groupsCount} groupe(s) · {m.directCount} direct(s)
                        </span>
                        <span className="font-semibold text-skin-base">
                          {m.totalCount.toLocaleString()} destinataires
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <StatusBadge status={m.status} />
                        {m.status === "failed" && m.lastError ? (
                          <span
                            className="text-xs text-rose-600 truncate"
                            title={m.lastError}
                          >
                            {m.lastError}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {m.status === "scheduled" ? (
                        <button
                          className="rounded-xl px-3 py-1.5 text-xs ring-1 ring-skin-border/20 hover:bg-skin-tile"
                          onClick={() => cancel(m.id)}
                          title="Annuler"
                        >
                          Annuler
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 sm:mt-3 sm:ml-8 sm:pl-4 border-t sm:border-t-0 sm:border-l border-skin-border/20">
                      {!info || info.loading ? (
                        <div className="text-xs text-skin-muted p-2">
                          Chargement des destinataires…
                        </div>
                      ) : recips.length === 0 ? (
                        <div className="text-xs text-skin-muted p-2">
                          Aucun destinataire.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {info.data?.groups?.length ? (
                            <div className="flex flex-wrap gap-2">
                              {info.data.groups.map((g) => (
                                <span
                                  key={g.id}
                                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg ring-1 ring-skin-border/30 bg-skin-tile"
                                  title={`${g.count} destinataires`}
                                >
                                  {g.name} · {g.count}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          <div className="max-h-44 overflow-y-auto pr-1">
                            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-xs text-skin-muted">
                              {recips.map((e) => (
                                <li key={e} className="truncate">
                                  {e}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
