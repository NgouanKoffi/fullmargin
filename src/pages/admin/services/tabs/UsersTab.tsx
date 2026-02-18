// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\services\tabs\UsersTab.tsx
/// <reference types="vite/client" />

import { useEffect, useMemo, useState } from "react";
import { Card } from "./SharedComponents";
import { loadSession } from "../../../../auth/lib/storage";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiMiniUserPlus,
  HiMiniMagnifyingGlass,
  HiMiniUser,
  HiMiniCheckCircle,
  HiMiniXMark,
  HiMiniCheck,
} from "react-icons/hi2";

/* =============== Types =============== */
type Presence = { status?: "online" | "away" | "offline"; lastPingAt?: string };
type UserLite = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  presence?: Presence;
};

type UsersListResponse = {
  users: UserLite[];
  total?: number;
  nextCursor?: { before: string; beforeId: string } | null;
};

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

/* =============== IO helpers =============== */

// Base API (prod : https://api.fullmargin.net/api ; dev : /api via proxy Vite)
const API_BASE: string = (import.meta.env?.VITE_API_BASE ?? "/api").toString();
const PAGE_SIZE = 200;

// ✅ fallback avatar CDN
const FALLBACK_AVATAR = "https://fullmargin-cdn.b-cdn.net/unknow.png";

// Join propre (évite les doubles / et le //api)
function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function isFormData(x: unknown): x is FormData {
  return typeof FormData !== "undefined" && x instanceof FormData;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = loadSession()?.token || null;

  // Autorise les URLs absolues, sinon on préfixe avec API_BASE
  const url = /^https?:\/\//i.test(path) ? path : joinUrl(API_BASE, path);

  // Construit les headers
  const baseHeaders: HeadersInit = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Si body JSON et pas de Content-Type déjà fourni, on le met ici
  const mergedHeaders: HeadersInit = {
    ...baseHeaders,
    ...(init?.headers || {}),
  };

  const hasBody = typeof init?.body !== "undefined" && !isFormData(init?.body);
  if (
    hasBody &&
    !("Content-Type" in (mergedHeaders as Record<string, string>))
  ) {
    (mergedHeaders as Record<string, string>)["Content-Type"] =
      "application/json";
  }

  const res = await fetch(url, {
    ...init,
    headers: mergedHeaders,
    credentials: "include",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      `[${res.status}] ${res.statusText}${txt ? ` — ${txt.slice(0, 180)}` : ""}`
    );
  }

  const ct = res.headers.get("content-type") || "";
  if (!/json/i.test(ct)) {
    const peek = await res.text().catch(() => "");
    // Ici on renvoie une erreur explicite au lieu de laisser JSON.parse crasher
    throw new Error(
      `Réponse non-JSON reçue (content-type="${ct}")${
        peek ? ` — aperçu: ${peek.slice(0, 180)}` : ""
      }`
    );
  }

  return (await res.json()) as T;
}

async function fetchUsers(params: {
  limit?: number;
  q?: string;
  role?: "agent";
  cursor?: { before: string; beforeId: string } | null;
}): Promise<UsersListResponse> {
  const sp = new URLSearchParams();
  sp.set("limit", String(params.limit ?? PAGE_SIZE));

  const qq = (params.q || "").trim();
  if (qq) sp.set("q", qq);

  if (params.role) sp.set("role", params.role);

  if (params.cursor?.before) sp.set("before", params.cursor.before);
  if (params.cursor?.beforeId) sp.set("beforeId", params.cursor.beforeId);

  return api(`admin/users?${sp.toString()}`);
}

async function fetchServices(): Promise<{ services: ServiceRow[] }> {
  const r = await api<{
    services?: ServiceDocFromAPI[];
    items?: ServiceDocFromAPI[];
  }>("admin/services");
  const list = Array.isArray(r.services)
    ? r.services
    : Array.isArray(r.items)
    ? r.items
    : [];
  // 🔑 Normaliser _id -> id pour l’UI
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

async function saveUserServiceMemberships(
  userId: string,
  serviceIds: string[]
) {
  // envoie les vrais ObjectId (id normalisés depuis _id)
  return api("admin/service-memberships", {
    method: "POST",
    body: JSON.stringify({ userId, serviceIds }),
  });
}

/* =============== UI bits =============== */
function PresenceDot({ status }: { status: "online" | "away" | "offline" }) {
  const colors: Record<"online" | "away" | "offline", string> = {
    online: "bg-emerald-500",
    away: "bg-amber-400",
    offline: "bg-slate-400",
  };
  const glow: Record<"online" | "away" | "offline", string> = {
    online: "shadow-[0_0_0_6px_rgba(16,185,129,0.18)]",
    away: "shadow-[0_0_0_6px_rgba(251,191,36,0.18)]",
    offline: "shadow-[0_0_0_0_rgba(148,163,184,0)]",
  };
  const animate =
    status === "online"
      ? { scale: [1, 1.2, 1], opacity: [1, 0.9, 1] }
      : status === "away"
      ? { y: [0, -1, 0] }
      : {};
  return (
    <motion.span
      className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status]} ${glow[status]}`}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      animate={animate}
      aria-label={status}
      title={status}
    />
  );
}

function SmallBadge({
  tone,
  children,
}: {
  tone: "indigo" | "emerald";
  children: React.ReactNode;
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
      : "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${cls}`}
    >
      {tone === "emerald" ? (
        <HiMiniCheckCircle className="h-3.5 w-3.5" />
      ) : (
        <HiMiniUser className="h-3.5 w-3.5" />
      )}
      {children}
    </span>
  );
}

/* =============== Modal d’intégration =============== */
function IntegrateModal({
  open,
  user,
  services,
  currentServiceIds,
  onClose,
  onSave,
}: {
  open: boolean;
  user: UserLite | null;
  services: ServiceRow[];
  currentServiceIds: string[];
  onClose: () => void;
  onSave: (selectedIds: string[]) => void;
}) {
  const [picked, setPicked] = useState<string[]>(currentServiceIds);
  const [q, setQ] = useState("");

  useEffect(() => {
    setPicked(currentServiceIds);
    setQ("");
  }, [currentServiceIds, open]);

  // ⬇️ hooks avant early-return
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return services;
    return services.filter(
      (v) =>
        v.name.toLowerCase().includes(s) || v.email.toLowerCase().includes(s)
    );
  }, [q, services]);

  if (!open || !user) return null;

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const allShownIds = filtered.map((s) => s.id);
  const allShownChecked =
    allShownIds.length > 0 && allShownIds.every((id) => picked.includes(id));
  const someShownChecked =
    allShownIds.some((id) => picked.includes(id)) && !allShownChecked;

  const selectAllShown = () =>
    setPicked((p) => {
      const set = new Set(p);
      allShownIds.forEach((id) => set.add(id));
      return [...set];
    });
  const unselectAllShown = () =>
    setPicked((p) => p.filter((id) => !allShownIds.includes(id)));

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop blur */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      <div className="absolute inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[640px]">
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          className="m-0 rounded-t-2xl sm:rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl"
        >
          {/* Accent */}
          <div className="relative">
            <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-indigo-500 via-fuchsia-500 to-pink-500 opacity-80" />
            {/* Header */}
            <div className="pl-5 pr-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={(user.avatarUrl || "").trim() || FALLBACK_AVATAR}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_AVATAR;
                    }}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 shadow-sm"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <PresenceDot status={user.presence?.status || "offline"} />
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate max-w-[280px] sm:max-w-[360px]">
                      {user.fullName}
                    </p>
                    <SmallBadge
                      tone={currentServiceIds.length ? "emerald" : "indigo"}
                    >
                      {currentServiceIds.length ? "Agent" : "User"}
                    </SmallBadge>
                  </div>
                  <p className="text-[12px] text-slate-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                title="Fermer"
                aria-label="Fermer"
              >
                <HiMiniXMark className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5">
            {/* Top controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="relative w-full sm:flex-1">
                <HiMiniMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher un service…"
                  className="w-full rounded-lg pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                />
              </div>

              <div className="flex items-center gap-2">
                <label
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs cursor-pointer select-none"
                  title={
                    someShownChecked ? "Partiellement sélectionné" : undefined
                  }
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-indigo-600"
                    checked={allShownChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = someShownChecked;
                    }}
                    onChange={(e) =>
                      e.target.checked ? selectAllShown() : unselectAllShown()
                    }
                  />
                  Tout (page)
                </label>

                <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[11px]">
                  {picked.length} sélectionné{picked.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* List */}
            <div className="mt-3 max-h-[46vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  Aucun service.
                </div>
              ) : (
                filtered.map((s) => {
                  const checked = picked.includes(s.id);
                  return (
                    <label
                      key={s.id || `${s.name}-${s.email}`}
                      className="group flex items-center justify-between gap-3 px-3 py-2.5 cursor-pointer hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{s.name}</p>
                        <p className="text-[12px] text-slate-500 break-words">
                          {s.email}
                        </p>
                      </div>

                      <span
                        className={[
                          "h-6 w-6 inline-flex items-center justify-center rounded-md border transition",
                          checked
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-slate-300 dark:border-slate-700 text-transparent",
                        ].join(" ")}
                      >
                        <HiMiniCheck className="h-4 w-4" />
                      </span>

                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={() => toggle(s.id)}
                      />
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer sticky */}
          <div className="sticky bottom-0 px-4 sm:px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-slate-500">
                {picked.length ? (
                  <>
                    {picked.length} service{picked.length > 1 ? "s" : ""}{" "}
                    sélectionné
                    {picked.length > 1 ? "s" : ""}.
                  </>
                ) : (
                  <>Aucune sélection.</>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-3 rounded-md text-sm border border-slate-300 dark:border-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => onSave(picked)}
                  className="h-9 px-3 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* =============== Page =============== */
export function UsersTab() {
  const [q, setQ] = useState("");
  const [view, setView] = useState<"all" | "agents">(
    (localStorage.getItem("fm.users.filter") as "all" | "agents") || "all"
  );

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [err, setErr] = useState<string | null>(null);

  const [rows, setRows] = useState<UserLite[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);

  const [totalUsers, setTotalUsers] = useState(0);
  const [cursor, setCursor] = useState<{
    before: string;
    beforeId: string;
  } | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // mapping local (en session) userId -> serviceIds pour précocher dans le modal
  const [userServices, setUserServices] = useState<Record<string, string[]>>(
    {}
  );

  const [open, setOpen] = useState(false);
  const [pickedUser, setPickedUser] = useState<UserLite | null>(null);

  // ✅ charge les services une seule fois
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const srv = await fetchServices();
        if (!cancel) setServices(srv.services || []);
      } catch (e: unknown) {
        if (!cancel) {
          setErr(
            e instanceof Error ? e.message : "Erreur de chargement services"
          );
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // ✅ charge les users (paginé) à chaque changement de q/view (debounce)
  useEffect(() => {
    let cancel = false;
    const t = setTimeout(() => {
      (async () => {
        setLoading(true);
        setErr(null);
        setRows([]);
        setCursor(null);
        setHasMore(false);
        setTotalUsers(0);

        try {
          const role = view === "agents" ? "agent" : undefined;
          const r = await fetchUsers({ limit: PAGE_SIZE, q, role });

          if (!cancel) {
            const users = Array.isArray(r.users) ? r.users : [];
            setRows(users);

            const total = typeof r.total === "number" ? r.total : users.length;
            setTotalUsers(total);

            const next = r.nextCursor ?? null;
            setCursor(next);
            setHasMore(!!next);
          }
        } catch (e: unknown) {
          if (!cancel) {
            setErr(e instanceof Error ? e.message : "Erreur de chargement");
          }
        } finally {
          if (!cancel) setLoading(false);
        }
      })();
    }, 250);

    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [q, view]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setErr(null);

    try {
      const role = view === "agents" ? "agent" : undefined;
      const r = await fetchUsers({ limit: PAGE_SIZE, q, role, cursor });

      const next = r.nextCursor ?? null;

      setRows((prev) => {
        const map = new Map(prev.map((u) => [u.id, u]));
        for (const u of r.users || []) map.set(u.id, u);
        return Array.from(map.values());
      });

      if (typeof r.total === "number") setTotalUsers(r.total);

      setCursor(next);
      setHasMore(!!next);
    } catch (e: unknown) {
      setErr(
        e instanceof Error ? e.message : "Erreur chargement page suivante"
      );
    } finally {
      setLoadingMore(false);
    }
  };

  // (fallback local) au cas où l’API ne filtre pas exactement comme prévu
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let base = rows;

    if (s) {
      base = base.filter(
        (u) =>
          u.fullName.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s)
      );
    }

    if (view === "agents") {
      base = base.filter((u) => u.roles.includes("agent"));
    }

    return base;
  }, [q, rows, view]);

  const openIntegrate = (u: UserLite) => {
    setPickedUser(u);
    setOpen(true);
  };

  const saveFromModal = async (serviceIds: string[]) => {
    if (!pickedUser) return;
    setUserServices((prev) => ({ ...prev, [pickedUser.id]: serviceIds }));

    try {
      await saveUserServiceMemberships(pickedUser.id, serviceIds);

      setRows((prev) =>
        prev.map((u) => {
          if (u.id !== pickedUser.id) return u;
          const hasAgent = u.roles.includes("agent");
          if (serviceIds.length > 0 && !hasAgent) {
            return { ...u, roles: [...u.roles, "agent"] };
          }
          if (serviceIds.length === 0 && hasAgent) {
            return { ...u, roles: u.roles.filter((r) => r !== "agent") };
          }
          return u;
        })
      );
    } catch (e: unknown) {
      setErr(
        e instanceof Error
          ? e.message
          : "Échec de la sauvegarde des intégrations"
      );
    } finally {
      setOpen(false);
    }
  };

  // persiste le choix du filtre
  useEffect(() => {
    localStorage.setItem("fm.users.filter", view);
  }, [view]);

  const counterText = useMemo(() => {
    if (loading) return "Chargement…";
    if (totalUsers > 0 && (hasMore || totalUsers > filtered.length)) {
      return `${filtered.length} / ${totalUsers} résultats`;
    }
    const n = totalUsers > 0 ? totalUsers : filtered.length;
    return `${n} résultat${n > 1 ? "s" : ""}`;
  }, [loading, totalUsers, filtered.length, hasMore]);

  return (
    <div
      id="panel-users"
      role="tabpanel"
      aria-labelledby="tab-users"
      className="mt-4 space-y-3"
    >
      {/* Search + Filter row */}
      <Card>
        <div className="grid gap-3 sm:grid-cols-12 items-stretch sm:items-center">
          {/* Recherche */}
          <div className="sm:col-span-7 lg:col-span-8 relative">
            <HiMiniMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un utilisateur…"
              className="w-full rounded-lg pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
            />
          </div>

          {/* Filtre (segmenté) */}
          <div className="sm:col-span-3 lg:col-span-2">
            <div
              className="
                grid grid-cols-2 w-full overflow-hidden rounded-lg
                border border-slate-300 dark:border-slate-700
                sm:inline-grid sm:auto-cols-max
              "
              role="tablist"
              aria-label="Filtrer les utilisateurs"
            >
              <button
                type="button"
                aria-pressed={view === "all"}
                onClick={() => setView("all")}
                className={[
                  "px-3 py-2 text-sm flex items-center justify-center gap-1",
                  view === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300",
                ].join(" ")}
              >
                <HiMiniUser className="h-4 w-4" />
                <span className="sm:hidden">Tous</span>
                <span className="hidden sm:inline">Tous</span>
              </button>

              <button
                type="button"
                aria-pressed={view === "agents"}
                onClick={() => setView("agents")}
                className={[
                  "px-3 py-2 text-sm flex items-center justify-center gap-1",
                  "sm:border-l sm:border-slate-300 sm:dark:border-slate-700",
                  view === "agents"
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300",
                ].join(" ")}
              >
                <HiMiniCheckCircle className="h-4 w-4" />
                <span className="sm:hidden">Agents</span>
                <span className="hidden sm:inline">Agents</span>
              </button>
            </div>
          </div>

          {/* Compteur */}
          <div className="sm:col-span-2 lg:col-span-2 sm:justify-self-end">
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {counterText}
            </span>
          </div>
        </div>
      </Card>

      {err && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 px-4 py-3 text-sm">
          {err}
        </div>
      )}

      <Card>
        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm">
              <HiMiniUserPlus className="h-6 w-6 text-slate-500" />
            </div>
            <p className="text-sm text-slate-500">Aucun utilisateur trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2 pr-3">Utilisateur</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Rôle</th>
                  <th className="py-2 pr-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((u) => {
                  const status = u.presence?.status || "offline";
                  const isAgent = u.roles.includes("agent");

                  return (
                    <tr
                      key={u.id}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      {/* Utilisateur */}
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <img
                              src={
                                (u.avatarUrl || "").trim() || FALLBACK_AVATAR
                              }
                              onError={(e) => {
                                e.currentTarget.src = FALLBACK_AVATAR;
                              }}
                              alt=""
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 shadow-sm"
                            />
                            <span className="absolute -bottom-0.5 -right-0.5">
                              <PresenceDot status={status} />
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">
                                {u.fullName}
                              </p>
                              {isAgent ? (
                                <SmallBadge tone="emerald">Agent</SmallBadge>
                              ) : (
                                <SmallBadge tone="indigo">User</SmallBadge>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Créé le{" "}
                              {new Date(u.createdAt).toLocaleDateString(
                                "fr-FR"
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-2 pr-3 text-slate-700 dark:text-slate-300">
                        <a
                          href={`mailto:${u.email}`}
                          className="hover:underline underline-offset-2 decoration-slate-300"
                        >
                          {u.email}
                        </a>
                      </td>

                      {/* Rôle */}
                      <td className="py-2 pr-3">
                        <span className="text-xs">
                          {isAgent ? "Agent" : "User"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2 pl-3">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition"
                            onClick={() => openIntegrate(u)}
                          >
                            <HiMiniUserPlus className="h-4 w-4" />
                            Intégrer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Charger plus */}
            {!loading && hasMore && (
              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="h-10 px-4 rounded-md text-sm font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
                >
                  {loadingMore ? "Chargement…" : "Charger plus"}
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Modal (nouveau design) */}
      <AnimatePresence>
        {open && (
          <IntegrateModal
            open={open}
            user={pickedUser}
            services={services}
            currentServiceIds={
              pickedUser ? userServices[pickedUser.id] || [] : []
            }
            onClose={() => setOpen(false)}
            onSave={saveFromModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
