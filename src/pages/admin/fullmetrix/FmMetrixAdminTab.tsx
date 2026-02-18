// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\fullmetrix\FmMetrixAdminTab.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Smartphone,
  Users,
  Archive,
} from "lucide-react";
import { api, API_BASE, getAuthToken } from "../../../lib/api";
import { notifyError } from "../../../components/Notification";

import CryptoPendingTable from "./components/CryptoPendingTable";
import ActiveSubscriptionsTable from "./components/ActiveSubscriptionsTable";
import ManualGrantModal from "./ManualGrantModal";
import type { FmMetrixAdminItem, AdminListRes } from "./types";

type AnyRes = {
  ok?: boolean;
  error?: string;
  message?: string;
  items?: unknown;
  total?: unknown;
};

type Diag = {
  origin: string;
  apiBase: string;
  tokenPresent: boolean;
  tokenPreview: string;
  lastUrl: string;
  lastLoadedAt: string;
  listItemsCount: number;
  mergedItemsCount: number;
  statuses: Record<string, number>;
  pendingCount: number;
  pendingEndpointTried: boolean;
  pendingEndpointOk: boolean | null;
  pendingEndpointCount: number;
  error: string | null;
};

function normalizeStatus(s: unknown): string {
  if (typeof s !== "string") return "";
  // pending-crypto / pending crypto / Pending_Crypto => pending_crypto
  return s
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function countStatuses(items: FmMetrixAdminItem[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) {
    const k = normalizeStatus((it as any)?.status) || "(empty)";
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export default function FullMetrixAdminPage() {
  const [items, setItems] = useState<FmMetrixAdminItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showManualGrant, setShowManualGrant] = useState(false);

  // Nouveaux états d'onglets (Active | Expired | Pending)
  const [tab, setTab] = useState<"active" | "expired" | "pending">("active");
  const [search, setSearch] = useState("");

  // Debug: ajoute ?debug=1 à l’URL en prod pour voir ce que le front reçoit
  const debugEnabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).has("debug");
  }, []);

  const [diag, setDiag] = useState<Diag | null>(null);

  async function loadData() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const token = getAuthToken();
    const tokenPreview = token
      ? `${token.slice(0, 14)}…${token.slice(-10)}`
      : "";

    // IMPORTANT: en cas de token absent, on le voit direct
    if (!token) {
      const d: Diag = {
        origin,
        apiBase: API_BASE,
        tokenPresent: false,
        tokenPreview: "",
        lastUrl: "(no request)",
        lastLoadedAt: new Date().toISOString(),
        listItemsCount: 0,
        mergedItemsCount: 0,
        statuses: {},
        pendingCount: 0,
        pendingEndpointTried: false,
        pendingEndpointOk: null,
        pendingEndpointCount: 0,
        error:
          "Token introuvable (localStorage). Le front ne peut pas s'authentifier.",
      };
      setDiag(d);
      setItems([]);
      notifyError("Session invalide : token introuvable. Reconnecte-toi.");
      return;
    }

    try {
      setLoading(true);

      // 1) LISTE PRINCIPALE
      const listPath = "/payments/admin/fm-metrix/list";
      const listUrl =
        typeof API_BASE === "string" && API_BASE.startsWith("http")
          ? `${API_BASE.replace(/\/+$/, "")}${listPath}`
          : `${origin}${String(API_BASE || "/api")}${listPath}`;

      const listRes = await api.get<AdminListRes>(listPath, {
        query: { limit: 200 },
        withAuth: true,
      });

      // Si ton backend renvoie 200 + ok:false => sinon ça passe “silencieusement”
      const lr = listRes as unknown as AnyRes;
      if (lr?.ok === false) {
        const msg = lr.error || lr.message || "Non authentifié";
        throw new Error(`[fm-metrix/list] ${msg}`);
      }

      const listItems = Array.isArray((listRes as any)?.items)
        ? ((listRes as any).items as FmMetrixAdminItem[])
        : [];

      // 2) OPTIONAL: récupérer les pending via un endpoint dédié si le backend prod ne les inclut pas dans /list
      // (si l’endpoint n’existe pas, on catch et on continue)
      let merged = [...listItems];
      let pendingEndpointTried = false;
      let pendingEndpointOk: boolean | null = null;
      let pendingEndpointCount = 0;

      try {
        pendingEndpointTried = true;
        const pendingRes = await api.get<AdminListRes>(
          "/payments/admin/fm-metrix/crypto/pending",
          { query: { limit: 200 }, withAuth: true },
        );

        const pr = pendingRes as unknown as AnyRes;
        if (pr?.ok === false) {
          pendingEndpointOk = false;
        } else {
          const pItems = Array.isArray((pendingRes as any)?.items)
            ? ((pendingRes as any).items as FmMetrixAdminItem[])
            : [];

          // on force le status si jamais le backend ne le met pas
          const normalizedPending = pItems.map((it) => {
            const st = normalizeStatus((it as any)?.status);
            return {
              ...it,
              status: st ? (it as any).status : ("pending_crypto" as any),
            };
          });

          pendingEndpointCount = normalizedPending.length;
          pendingEndpointOk = true;

          // merge + dédoublonnage par id
          const byId = new Map<string, FmMetrixAdminItem>();
          for (const it of [...merged, ...normalizedPending]) {
            const id = String((it as any)?.id ?? "");
            if (!id) continue;
            byId.set(id, it);
          }
          merged = Array.from(byId.values());
        }
      } catch {
        // endpoint absent -> ok, on continue juste avec /list
        pendingEndpointOk = null;
      }

      setItems(merged);

      const statuses = countStatuses(merged);
      const pendingCount = merged.filter(
        (it) => normalizeStatus((it as any)?.status) === "pending_crypto",
      ).length;

      setDiag({
        origin,
        apiBase: API_BASE,
        tokenPresent: true,
        tokenPreview,
        lastUrl: listUrl,
        lastLoadedAt: new Date().toISOString(),
        listItemsCount: listItems.length,
        mergedItemsCount: merged.length,
        statuses,
        pendingCount,
        pendingEndpointTried,
        pendingEndpointOk,
        pendingEndpointCount,
        error: null,
      });
    } catch (e) {
      const msg = getErrorMessage(e);
      console.error(e);
      notifyError("Impossible de charger les abonnements.");

      setItems([]);

      setDiag({
        origin: typeof window !== "undefined" ? window.location.origin : "",
        apiBase: API_BASE,
        tokenPresent: !!getAuthToken(),
        tokenPreview: getAuthToken()
          ? `${getAuthToken()!.slice(0, 14)}…${getAuthToken()!.slice(-10)}`
          : "",
        lastUrl: "(failed request)",
        lastLoadedAt: new Date().toISOString(),
        listItemsCount: 0,
        mergedItemsCount: 0,
        statuses: {},
        pendingCount: 0,
        pendingEndpointTried: false,
        pendingEndpointOk: null,
        pendingEndpointCount: 0,
        error: msg,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  // 1. Séparer les items bruts
  const pendingCryptoItems = useMemo(
    () =>
      items.filter(
        (it) => normalizeStatus((it as any)?.status) === "pending_crypto",
      ),
    [items],
  );

  const allProcessedItems = useMemo(
    () =>
      items.filter(
        (it) => normalizeStatus((it as any)?.status) !== "pending_crypto",
      ),
    [items],
  );

  // 2. Grouper par utilisateur pour savoir qui est "Active" vs "Expired"
  const { activeCount, expiredCount, activeItems, expiredItems } =
    useMemo(() => {
      const active: FmMetrixAdminItem[] = [];
      const expired: FmMetrixAdminItem[] = [];
      let countActiveUsers = 0;
      let countExpiredUsers = 0;

      const userGroups = new Map<string, FmMetrixAdminItem[]>();
      allProcessedItems.forEach((it) => {
        const key = (it as any).userEmail || (it as any).userId || "unknown";
        if (!userGroups.has(key)) userGroups.set(key, []);
        userGroups.get(key)?.push(it);
      });

      userGroups.forEach((userItems) => {
        const hasActiveSub = userItems.some((it) => {
          const st = normalizeStatus((it as any)?.status);
          const end = (it as any)?.periodEnd;
          return st !== "expired" && end && new Date(end) > new Date();
        });

        if (hasActiveSub) {
          active.push(...userItems);
          countActiveUsers++;
        } else {
          expired.push(...userItems);
          countExpiredUsers++;
        }
      });

      return {
        activeItems: active,
        expiredItems: expired,
        activeCount: countActiveUsers,
        expiredCount: countExpiredUsers,
      };
    }, [allProcessedItems]);

  // 3. Filtrage final par recherche et onglet
  const displayedItems = useMemo(() => {
    let source: FmMetrixAdminItem[] = [];
    if (tab === "pending") source = pendingCryptoItems;
    else if (tab === "active") source = activeItems;
    else if (tab === "expired") source = expiredItems;

    const q = search.trim().toLowerCase();
    if (!q) return source;

    return source.filter((it) => {
      const uName = String((it as any)?.userName || "").toLowerCase();
      const uEmail = String((it as any)?.userEmail || "").toLowerCase();
      const cRef = String((it as any)?.cryptoRef || "").toLowerCase();
      return uName.includes(q) || uEmail.includes(q) || cRef.includes(q);
    });
  }, [tab, pendingCryptoItems, activeItems, expiredItems, search]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* DEBUG BOX */}
      {debugEnabled && diag && (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50/70 dark:bg-amber-500/10 dark:border-amber-500/30 p-4 text-xs font-mono text-slate-700 dark:text-slate-200">
          <div className="font-bold mb-2">FM-METRIX DEBUG</div>
          <div>origin: {diag.origin}</div>
          <div>API_BASE: {String(diag.apiBase)}</div>
          <div>token: {diag.tokenPresent ? diag.tokenPreview : "❌ NONE"}</div>
          <div>lastUrl: {diag.lastUrl}</div>
          <div>loadedAt: {diag.lastLoadedAt}</div>
          <div>listItemsCount: {diag.listItemsCount}</div>
          <div>mergedItemsCount: {diag.mergedItemsCount}</div>
          <div>pendingCount: {diag.pendingCount}</div>
          <div>
            pendingEndpoint:{" "}
            {diag.pendingEndpointTried
              ? diag.pendingEndpointOk === true
                ? `✅ ok (${diag.pendingEndpointCount})`
                : diag.pendingEndpointOk === false
                  ? "❌ ok:false"
                  : "⚠️ not found/ignored"
              : "not tried"}
          </div>
          <div className="mt-2">
            statuses:{" "}
            {Object.entries(diag.statuses)
              .map(([k, v]) => `${k}:${v}`)
              .join(", ") || "(none)"}
          </div>
          {diag.error && (
            <div className="mt-2 text-red-600">error: {diag.error}</div>
          )}
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            FM Metrix Pro
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gérez les abonnements, les accès manuels et validez les paiements
            crypto.
          </p>
        </div>

        <button
          onClick={() => setShowManualGrant(true)}
          className="flex items-center gap-2 bg-slate-900 dark:bg-emerald-500 dark:text-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-emerald-400 transition shadow-lg shadow-slate-900/10 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium text-sm">Donner un accès</span>
        </button>
      </div>

      {/* Barre d'outils (Tabs + Recherche) */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 scrollbar-hide">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent dark:border-slate-700 min-w-max">
            <button
              onClick={() => setTab("active")}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                tab === "active"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Users className="w-4 h-4" />
              En cours
              <span className="ml-1.5 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-[10px] px-1.5 py-0.5 rounded-md">
                {activeCount}
              </span>
            </button>

            <button
              onClick={() => setTab("expired")}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                tab === "expired"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Archive className="w-4 h-4" />
              Expirés
              <span className="ml-1.5 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-[10px] px-1.5 py-0.5 rounded-md">
                {expiredCount}
              </span>
            </button>

            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>

            <button
              onClick={() => setTab("pending")}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition relative ${
                tab === "pending"
                  ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Validations Crypto</span>
              <span className="inline sm:hidden">Crypto</span>
              {pendingCryptoItems.length > 0 && (
                <span className="ml-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {pendingCryptoItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Barre de recherche + Refresh */}
        <div className="flex gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <button
            onClick={() => void loadData()}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition shadow-sm shrink-0"
            title="Actualiser les données"
          >
            <RefreshCw
              className={`w-5 h-5 ${loading ? "animate-spin text-indigo-500" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="min-h-[400px]">
        {tab === "pending" ? (
          <CryptoPendingTable items={displayedItems} onRefresh={loadData} />
        ) : (
          <ActiveSubscriptionsTable
            items={displayedItems}
            onRefresh={loadData}
            loading={loading}
          />
        )}
      </div>

      {showManualGrant && (
        <ManualGrantModal
          onClose={() => setShowManualGrant(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
