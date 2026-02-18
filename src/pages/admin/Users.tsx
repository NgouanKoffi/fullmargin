// src/pages/admin/Users.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { loadSession } from "../../auth/lib/storage";
import UsersTable from "./components/admin/users/UsersTable";
import ArchivedUsersTable, {
  type ArchivedUserRow,
} from "./components/admin/users/ArchivedUsersTable";
import UsersStats from "./components/admin/users/UsersStats";
import UserModal from "./components/admin/users/UserModal";
import type { UserRow } from "./userstypes";
import { notifyError, notifySuccess } from "../../components/Notification";

/* --------------------- Constantes --------------------- */
const DEFAULT_AVATAR = "https://fullmargin-cdn.b-cdn.net/unknow.png";
const PAGE_SIZE = 200;
const MAX_PAGES_GUARD = 200; // garde-fou anti-boucle infinie

/* --------------------- Types --------------------- */
type Cursor = { before: string; beforeId: string };
type ApiListResp = {
  users: UserRow[];
  total?: number;
  nextCursor?: Cursor | null;
};
type ApiArchivedList = {
  users: ArchivedUserRow[];
  total?: number;
  nextCursor?: Cursor | null;
};

/* --------------------- API base + helpers --------------------- */
const API_BASE: string = (import.meta.env?.VITE_API_BASE ?? "/api").toString();

function isAbsoluteUrl(u: string) {
  return /^https?:\/\//i.test(u);
}
function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
function buildApiUrl(path: string) {
  if (isAbsoluteUrl(path)) return path;
  const trimmed = path.replace(/^\/+/, "");
  const withoutApi = trimmed.startsWith("api/") ? trimmed.slice(4) : trimmed;
  return joinUrl(API_BASE, withoutApi);
}

/* --------------------- Fetch (auth + JSON-safe) --------------------- */
async function authGetJSON<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = loadSession()?.token || null;
  const finalUrl = buildApiUrl(url);

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const bodyProvided = init.body !== undefined && init.body !== null;
  const isFD = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (bodyProvided && !isFD && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const fetchInit: RequestInit = {
    ...init,
    method: init.method ?? "GET",
    headers,
    credentials: "include",
    ...(init.body !== null && init.body !== undefined
      ? { body: init.body }
      : {}),
  };

  const res = await fetch(finalUrl, fetchInit);

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      `[${res.status}] ${res.statusText}${txt ? ` — ${txt.slice(0, 180)}` : ""}`
    );
  }

  const ct = res.headers.get("content-type") || "";
  if (!/json/i.test(ct)) {
    const peek = await res.text().catch(() => "");
    throw new Error(
      `Réponse non-JSON reçue (content-type="${ct}")${
        peek ? ` — aperçu: ${peek.slice(0, 180)}` : ""
      }`
    );
  }

  return res.json() as Promise<T>;
}

/* --------------------- Normalisation avatar --------------------- */
function pickAvatar(anyUser: any): string {
  const candidates = [
    anyUser?.avatarUrl,
    anyUser?.avatar,
    anyUser?.photoUrl,
    anyUser?.picture,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return DEFAULT_AVATAR;
}

function normalizeUser(u: UserRow): UserRow {
  const anyUser = u as any;
  return {
    ...u,
    avatarUrl: pickAvatar(anyUser),
  } as UserRow;
}

function normalizeArchivedUser(u: ArchivedUserRow): ArchivedUserRow {
  const anyUser = u as any;
  return {
    ...u,
    avatarUrl: pickAvatar(anyUser),
  } as ArchivedUserRow;
}

/* --------------------- Pagination helpers --------------------- */
function buildPagedPath(basePath: string, cursor?: Cursor | null) {
  const sp = new URLSearchParams();
  sp.set("limit", String(PAGE_SIZE));
  if (cursor?.before) sp.set("before", cursor.before);
  if (cursor?.beforeId) sp.set("beforeId", cursor.beforeId);
  return `${basePath}?${sp.toString()}`;
}

function mergeById<T extends { id: string }>(prev: T[], next: T[]) {
  const map = new Map(prev.map((x) => [x.id, x]));
  for (const x of next) map.set(x.id, x);
  return Array.from(map.values());
}

/* --------------------- Modals locaux --------------------- */
function ReasonModal({
  open,
  title = "Supprimer le compte",
  message,
  placeholder = "Explique brièvement le motif…",
  minLength = 4,
  danger = true,
  confirmText = "Supprimer",
  cancelText = "Annuler",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message?: ReactNode;
  placeholder?: string;
  minLength?: number;
  danger?: boolean;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const canSend = reason.trim().length >= minLength && !loading;

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onCancel}
      />
      <div
        className="relative w-full sm:max-w-md m-0 sm:m-4 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {message}
        </div>
        <div className="mt-4">
          <label className="block text-xs font-medium mb-1">
            Motif (obligatoire)
          </label>
          <textarea
            autoFocus
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400/40"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Le motif sera historisé avec l’opération.
          </p>
        </div>
        <div className="mt-4 sm:mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="inline-flex justify-center rounded-lg px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {cancelText}
          </button>
          <button
            onClick={() => canSend && onConfirm(reason.trim())}
            disabled={!canSend}
            className={[
              "inline-flex justify-center rounded-lg px-3 py-2 text-sm text-white",
              danger
                ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                : "bg-slate-900 hover:bg-black disabled:bg-slate-400 dark:bg-white dark:text-slate-900",
            ].join(" ")}
          >
            {loading ? "Suppression…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  open,
  title = "Confirmer",
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onCancel}
      />
      <div
        className="relative w-full sm:max-w-md m-0 sm:m-4 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {message}
        </div>
        <div className="mt-4 sm:mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="inline-flex justify-center rounded-lg px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex justify-center rounded-lg px-3 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400"
          >
            {loading ? "Restauration…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------- Page --------------------- */
export default function AdminUsersPage() {
  type Tab = "list" | "stats" | "archived";
  const [tab, setTab] = useState<Tab>("list");

  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersTotal, setUsersTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadingAll, setLoadingAll] = useState(false);

  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // archivage
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmUser, setConfirmUser] = useState<UserRow | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  // archived tab
  const [archived, setArchived] = useState<ArchivedUserRow[]>([]);
  const [archivedTotal, setArchivedTotal] = useState<number>(0);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [loadingAllArchived, setLoadingAllArchived] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [restoreId, setRestoreId] = useState<string | null>(null);

  // ====== loaders paginés (cassent la limite) ======
  const loadAllActiveUsers = async (opts?: { silent?: boolean }) => {
    let cancelled = false;

    const run = async () => {
      if (!opts?.silent) {
        setLoading(true);
        setErr(null);
      } else {
        setErr(null);
      }

      setUsers([]);
      setUsersTotal(0);

      try {
        // 1) première page : affichage rapide
        const firstPath = buildPagedPath("admin/users", null);
        const first = await authGetJSON<ApiListResp>(firstPath);

        if (cancelled) return;

        const firstUsers = (first.users || []).map(normalizeUser);
        setUsers(firstUsers);
        setUsersTotal(
          typeof first.total === "number" ? first.total : firstUsers.length
        );

        setLoading(false);

        // 2) pages suivantes : complétion en arrière-plan
        let next = first.nextCursor ?? null;
        if (!next) return;

        setLoadingAll(true);

        const seen = new Set<string>();
        let pages = 0;

        while (!cancelled && next) {
          const key = `${next.before}:${next.beforeId}`;
          if (seen.has(key)) break;
          seen.add(key);

          pages += 1;
          if (pages > MAX_PAGES_GUARD) break;

          const pagePath = buildPagedPath("admin/users", next);
          const page = await authGetJSON<ApiListResp>(pagePath);
          if (cancelled) return;

          const pageUsers = (page.users || []).map(normalizeUser);

          setUsers((prev) => mergeById(prev, pageUsers));
          if (typeof page.total === "number") setUsersTotal(page.total);

          next = page.nextCursor ?? null;
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Erreur de chargement");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingAll(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  };

  const loadAllArchivedUsers = async () => {
    let cancelled = false;

    const run = async () => {
      setLoadingArchived(true);
      setErr(null);
      setArchived([]);
      setArchivedTotal(0);

      try {
        // 1) première page
        const firstPath = buildPagedPath("admin/users/archived", null);
        const first = await authGetJSON<ApiArchivedList>(firstPath);
        if (cancelled) return;

        const firstRows = (first.users || []).map(normalizeArchivedUser);
        setArchived(firstRows);
        setArchivedTotal(
          typeof first.total === "number" ? first.total : firstRows.length
        );

        setLoadingArchived(false);

        // 2) pages suivantes
        let next = first.nextCursor ?? null;
        if (!next) return;

        setLoadingAllArchived(true);

        const seen = new Set<string>();
        let pages = 0;

        while (!cancelled && next) {
          const key = `${next.before}:${next.beforeId}`;
          if (seen.has(key)) break;
          seen.add(key);

          pages += 1;
          if (pages > MAX_PAGES_GUARD) break;

          const pagePath = buildPagedPath("admin/users/archived", next);
          const page = await authGetJSON<ApiArchivedList>(pagePath);
          if (cancelled) return;

          const pageRows = (page.users || []).map(normalizeArchivedUser);
          setArchived((prev) => mergeById(prev, pageRows));
          if (typeof page.total === "number") setArchivedTotal(page.total);

          next = page.nextCursor ?? null;
        }
      } catch (e: unknown) {
        if (!cancelled) {
          notifyError(
            e instanceof Error ? e.message : "Chargement impossible."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingArchived(false);
          setLoadingAllArchived(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  };

  // initial load (users actifs) — casse la limite via pagination
  useEffect(() => {
    let cancelFn: null | (() => void) = null;
    void (async () => {
      cancelFn = await loadAllActiveUsers();
    })();
    return () => {
      cancelFn?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load archived si on va sur l’onglet — casse la limite via pagination
  useEffect(() => {
    if (tab !== "archived") return;
    let cancelFn: null | (() => void) = null;
    void (async () => {
      cancelFn = await loadAllArchivedUsers();
    })();
    return () => {
      cancelFn?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const filtered = useMemo(() => {
    const base = users
      .slice()
      .sort(
        (a, b) => +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0)
      );

    const s = q.trim().toLowerCase();
    if (!s) return base;

    return base.filter((u) => {
      const roles = Array.isArray(u.roles) ? u.roles : [];
      return (
        (u.fullName || "").toLowerCase().includes(s) ||
        (u.email || "").toLowerCase().includes(s) ||
        roles.join(",").toLowerCase().includes(s)
      );
    });
  }, [users, q]);

  // helpers pour le modal détail
  type Fetcher = <T = unknown>(url: string) => Promise<T>;
  const fetchJSON: Fetcher = (url) => authGetJSON(url);
  const fetchSessions: Fetcher = (url) => authGetJSON(url);
  const fetchAudits: Fetcher = (url) => authGetJSON(url);

  // Ouvrir le modal de suppression (avec motif)
  const promptArchive = (id: string) => {
    const u = users.find((x) => x.id === id) || null;
    setConfirmUser(u);
    setConfirmOpen(!!u);
  };

  // Confirmer la suppression/archivage
  const doArchive = async (reason: string) => {
    if (!confirmUser) return;
    const user = confirmUser;
    try {
      setArchivingId(user.id);
      await authGetJSON<{ ok: true }>(`admin/users/${user.id}/archive`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });

      // update local list + total
      setUsers((arr) => arr.filter((u) => u.id !== user.id));
      setUsersTotal((t) => (t > 0 ? Math.max(0, t - 1) : t));

      if (selectedId === user.id) setSelectedId(null);
      notifySuccess("Compte archivé et supprimé de la liste.");

      // si onglet archived affiché, recharger (paginé)
      if (tab === "archived") {
        await loadAllArchivedUsers();
      }
    } catch (e: unknown) {
      notifyError(
        e instanceof Error ? e.message : "Suppression/archivage impossible."
      );
    } finally {
      setArchivingId(null);
      setConfirmOpen(false);
      setConfirmUser(null);
    }
  };

  // ouvrir confirm restauration
  const promptRestore = (archId: string) => {
    setRestoreId(archId);
    setConfirmRestoreOpen(true);
  };

  // confirmer restauration
  const doRestore = async () => {
    if (!restoreId) return;
    try {
      setRestoringId(restoreId);
      await authGetJSON<{ ok: true; userId: string }>(
        `admin/users/archived/${restoreId}/restore`,
        { method: "POST" }
      );

      notifySuccess("Compte réactivé.");
      setArchived((arr) => arr.filter((u) => u.id !== restoreId));
      setArchivedTotal((t) => (t > 0 ? Math.max(0, t - 1) : t));

      // recharger la liste active (paginé) pour le voir réapparaître
      await loadAllActiveUsers({ silent: true });
    } catch (e: unknown) {
      notifyError(e instanceof Error ? e.message : "Restauration impossible.");
    } finally {
      setRestoringId(null);
      setRestoreId(null);
      setConfirmRestoreOpen(false);
    }
  };

  const activeCountLabel = useMemo(() => {
    if (loading) return "Chargement…";
    const total = usersTotal || users.length;
    const loaded = users.length;
    if (loadingAll && total > loaded) return `${loaded} / ${total}`;
    return `${total}`;
  }, [loading, usersTotal, users.length, loadingAll]);

  const archivedCountLabel = useMemo(() => {
    if (loadingArchived && tab === "archived") return "…";
    const total = archivedTotal || archived.length;
    const loaded = archived.length;
    if (loadingAllArchived && total > loaded) return `${loaded} / ${total}`;
    return `${total}`;
  }, [
    loadingArchived,
    archivedTotal,
    archived.length,
    loadingAllArchived,
    tab,
  ]);

  return (
    <main className="w-full px-3 sm:px-6 py-6 sm:py-8 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Utilisateurs</h1>

          {/* ✅ compteur fiable (casse la limite) */}
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            {tab === "list"
              ? `${activeCountLabel} user${
                  Number(activeCountLabel) > 1 ? "s" : ""
                }`
              : tab === "archived"
              ? `${archivedCountLabel} désactivé${
                  archivedCountLabel !== "1" ? "s" : ""
                }`
              : "—"}
          </span>

          {tab === "list" && loadingAll && (
            <span className="text-[11px] text-slate-500">
              Chargement complet…
            </span>
          )}
        </div>

        {tab === "list" && (
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher nom, email, rôle…"
            className="w-full sm:w-80 rounded-xl px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        )}
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-1 inline-flex">
        <button
          className={`px-3 py-1.5 rounded-lg text-sm ${
            tab === "list"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "text-slate-700 dark:text-slate-200"
          }`}
          onClick={() => setTab("list")}
        >
          Liste{" "}
          <span className="ml-1 text-[11px] opacity-80">
            ({usersTotal || users.length || 0})
          </span>
        </button>

        <button
          className={`ml-1 px-3 py-1.5 rounded-lg text-sm ${
            tab === "archived"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "text-slate-700 dark:text-slate-200"
          }`}
          onClick={() => setTab("archived")}
        >
          Comptes désactivés{" "}
          <span className="ml-1 text-[11px] opacity-80">
            ({archivedTotal || archived.length || 0})
          </span>
        </button>

        <button
          className={`ml-1 px-3 py-1.5 rounded-lg text-sm ${
            tab === "stats"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "text-slate-700 dark:text-slate-200"
          }`}
          onClick={() => setTab("stats")}
        >
          Statistiques
        </button>
      </div>

      {err && (
        <div className="rounded-lg border border-red-300/70 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-800 dark:text-red-200 px-3 py-2 text-sm">
          {err}
        </div>
      )}

      {tab === "list" && (
        <UsersTable
          rows={filtered}
          loading={loading}
          onRowClick={(id: string) => setSelectedId(id)}
          onArchive={promptArchive}
          archivingId={archivingId ?? undefined}
        />
      )}

      {tab === "archived" && (
        <ArchivedUsersTable
          rows={archived}
          loading={loadingArchived}
          onRestore={promptRestore}
          restoringId={restoringId ?? undefined}
        />
      )}

      {tab === "stats" && <UsersStats />}

      {selectedId && (
        <UserModal
          userId={selectedId}
          onClose={() => setSelectedId(null)}
          fetchJSON={fetchJSON}
          fetchSessions={fetchSessions}
          fetchAudits={fetchAudits}
        />
      )}

      {/* Modal suppression + motif */}
      <ReasonModal
        open={confirmOpen && !!confirmUser}
        title="Supprimer le compte"
        message={
          confirmUser ? (
            <>
              <span className="font-medium">
                Voulez-vous vraiment supprimer ce compte ?
              </span>
              <br />
              L’utilisateur <b>{confirmUser.fullName}</b> ({confirmUser.email})
              sera déplacé dans <em>Comptes désactivés</em>. Il ne pourra plus
              se connecter.
            </>
          ) : null
        }
        minLength={4}
        danger
        confirmText="Supprimer"
        cancelText="Annuler"
        loading={!!archivingId}
        onConfirm={doArchive}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmUser(null);
        }}
      />

      {/* Modal confirmation restauration */}
      <ConfirmModal
        open={confirmRestoreOpen}
        title="Réactiver le compte"
        message="Le compte sera restauré parmi les utilisateurs actifs et pourra à nouveau se connecter."
        confirmText="Réactiver"
        cancelText="Annuler"
        loading={!!restoringId}
        onConfirm={doRestore}
        onCancel={() => {
          setConfirmRestoreOpen(false);
          setRestoreId(null);
        }}
      />
    </main>
  );
}
