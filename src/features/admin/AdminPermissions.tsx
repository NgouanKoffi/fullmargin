// src/pages/admin/AdminPermissions.tsx
import { useEffect, useState, useCallback } from "react";
import { loadSession } from "@core/auth/lib/storage";
import {
  Search,
  User,
  ShieldCheck,
  Shield,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ShieldQuestion,
  CheckSquare,
  Square,
} from "lucide-react";
import { API_BASE } from "@core/api/client";
import { createPortal } from "react-dom";

/* =============== Constantes des permissions =============== */
const PERMISSIONS_LIST = [
  { id: "visites", label: "Visites" },
  { id: "utilisateurs", label: "Utilisateurs" },
  { id: "permissions", label: "Accord d'accès" },
  { id: "fullmetrix", label: "Full Metrix" },
  { id: "communautes", label: "Communautés" },
  { id: "retraits", label: "Retraits" },
  { id: "messages", label: "Emails/Messages" },
  { id: "podcasts", label: "Podcasts" },
  { id: "marketplace", label: "Marketplace" },
  { id: "marketplace-crypto", label: "Crypto Marketplace" },
];

/* =============== Types =============== */
type UserLite = {
  id: string;
  _id?: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  roles: string[];
  adminPermissions?: string[];
  createdAt: string;
};

interface Cursor {
  before: string;
  beforeId: string;
}

type UsersListResponse = {
  users?: UserLite[];
  data?: { items?: UserLite[] };
  total?: number;
  nextCursor?: Cursor | null;
};

const FALLBACK_AVATAR = "https://fullmargin-cdn.b-cdn.net/unknow.png";
const PAGE_SIZE = 50;

export default function AdminPermissions() {
  const [q, setQ] = useState("");
  const [view, setView] = useState<"all" | "admins">("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [rows, setRows] = useState<UserLite[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  const [cursor, setCursor] = useState<Cursor | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [permEdit, setPermEdit] = useState<{
    user: UserLite;
    selected: string[];
  } | null>(null);

  const token = loadSession()?.token;

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsersList = useCallback(
    async (params: {
      limit: number;
      q: string;
      role?: string;
      cursor?: Cursor | null;
    }) => {
      if (!token) return { data: { items: [] } };
      const sp = new URLSearchParams();
      sp.set("limit", String(params.limit));
      if (params.q) sp.set("q", params.q);
      if (params.role) sp.set("role", params.role);
      if (params.cursor?.before) sp.set("before", params.cursor.before);
      if (params.cursor?.beforeId) sp.set("beforeId", params.cursor.beforeId);

      const res = await fetch(`${API_BASE}/admin/users?${sp.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur de chargement");
      return (await res.json()) as UsersListResponse;
    },
    [token],
  );

  useEffect(() => {
    let cancel = false;
    const t = setTimeout(() => {
      (async () => {
        setLoading(true);
        setRows([]);
        setCursor(null);
        setHasMore(false);
        setTotalUsers(0);

        try {
          const role = view === "admins" ? "admin" : undefined;
          const r = await fetchUsersList({
            limit: PAGE_SIZE,
            q: q.trim(),
            role,
          });

          if (!cancel) {
            const users = r.users || r.data?.items || [];
            setRows(users);
            setTotalUsers(typeof r.total === "number" ? r.total : users.length);
            const next = r.nextCursor ?? null;
            setCursor(next);
            setHasMore(!!next);
          }
        } catch {
          if (!cancel)
            showToast("Impossible de charger les utilisateurs", "error");
        } finally {
          if (!cancel) setLoading(false);
        }
      })();
    }, 300);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [q, view, fetchUsersList]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const role = view === "admins" ? "admin" : undefined;
      const r = await fetchUsersList({
        limit: PAGE_SIZE,
        q: q.trim(),
        role,
        cursor,
      });
      const newUsers = r.users || r.data?.items || [];
      const next = r.nextCursor ?? null;

      setRows((prev) => {
        const map = new Map(prev.map((u) => [u.id || u._id, u]));
        for (const u of newUsers) map.set(u.id || u._id, u);
        return Array.from(map.values());
      });
      setCursor(next);
      setHasMore(!!next);
    } catch {
      showToast("Impossible de charger la suite", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  const togglePerm = (id: string) => {
    if (!permEdit) return;
    setPermEdit((prev) => {
      if (!prev) return null;
      const next = prev.selected.includes(id)
        ? prev.selected.filter((x) => x !== id)
        : [...prev.selected, id];
      return { ...prev, selected: next };
    });
  };

  const savePermissions = async () => {
    if (!permEdit || !token || processingId) return;
    const uid = permEdit.user.id || permEdit.user._id;
    setProcessingId(uid || null);

    const isNowAdmin = permEdit.selected.length > 0;
    const roles = isNowAdmin ? ["admin"] : ["user"];

    try {
      const res = await fetch(`${API_BASE}/admin/users/${uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roles,
          adminPermissions: permEdit.selected,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setRows((prev) =>
          prev.map((u) =>
            (u.id || u._id) === uid
              ? { ...u, roles, adminPermissions: permEdit.selected }
              : u,
          ),
        );
        showToast("Permissions mises à jour avec succès", "success");
        setPermEdit(null);
      } else {
        showToast(data.error || "Erreur de sauvegarde", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 space-y-6 text-slate-900 dark:text-slate-100">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Shield className="text-violet-600" /> Accords d'accès
        </h1>
        <p className="text-sm text-slate-500">
          Gérez les accès aux différentes parties de l'administration.
        </p>
      </header>

      {/* Barre de recherche et filtres */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="w-full rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setView("all")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                view === "all"
                  ? "bg-white dark:bg-slate-900 text-violet-600 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setView("admins")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                view === "admins"
                  ? "bg-white dark:bg-slate-900 text-violet-600 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Admins
            </button>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg shrink-0">
            {loading ? "..." : `${totalUsers} résultat(s)`}
          </span>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Chargement des membres...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-20">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Aucun utilisateur trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Utilisateur</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Statut / Accès</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((u) => {
                  const isAdmin = u.roles?.includes("admin");
                  const isProcessing = processingId === (u.id || u._id);
                  const isSuperAdmin =
                    isAdmin &&
                    (!u.adminPermissions || u.adminPermissions.length === 0);

                  return (
                    <tr
                      key={u.id || u._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl || FALLBACK_AVATAR}
                            className="w-9 h-9 rounded-full object-cover bg-slate-200"
                            alt=""
                            onError={(e) =>
                              (e.currentTarget.src = FALLBACK_AVATAR)
                            }
                          />
                          <p className="font-bold truncate">
                            {u.fullName || "Utilisateur"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{u.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {isAdmin ? (
                            <span className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> ADMIN
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                              <User className="w-3 h-3" /> MEMBRE
                            </span>
                          )}

                          {/* ✅ Affichage du Super Admin s'il n'a pas de permissions spécifiques */}
                          {isSuperAdmin ? (
                            <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-0.5 rounded-lg text-[10px] font-medium border border-emerald-100 dark:border-emerald-800">
                              Accès Total
                            </span>
                          ) : (
                            u.adminPermissions?.map((p) => (
                              <span
                                key={p}
                                className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded-lg text-[10px] font-medium border border-blue-100 dark:border-blue-800"
                              >
                                {p}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            // ✅ PRÉ-COCHAGE: Si c'est le super admin, on coche tout par défaut pour ne pas le dégrader !
                            const allPerms = PERMISSIONS_LIST.map((p) => p.id);
                            const defaultSelected = isSuperAdmin
                              ? allPerms
                              : u.adminPermissions || [];
                            setPermEdit({ user: u, selected: defaultSelected });
                          }}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-2 text-xs font-bold text-violet-600 hover:text-violet-700 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Modifier les accès"
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {hasMore && (
              <div className="p-4 border-t dark:border-slate-800 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 rounded-xl text-sm font-semibold border dark:border-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {loadingMore ? "Chargement..." : "Afficher plus"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal des permissions */}
      {permEdit &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center">
                    <ShieldQuestion className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Gérer les accès</h3>
                    <p className="text-xs text-slate-500 truncate max-w-[240px]">
                      {permEdit.user.fullName || permEdit.user.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {PERMISSIONS_LIST.map((p) => {
                    const isChecked = permEdit.selected.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePerm(p.id)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                          isChecked
                            ? "bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800"
                            : "bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700"
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="text-violet-600 w-5 h-5 shrink-0" />
                        ) : (
                          <Square className="text-slate-300 w-5 h-5 shrink-0" />
                        )}
                        <span
                          className={`text-sm font-bold ${
                            isChecked
                              ? "text-violet-900 dark:text-white"
                              : "text-slate-400"
                          }`}
                        >
                          {p.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setPermEdit(null)}
                  className="flex-1 py-5 text-sm font-bold text-slate-500 hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={savePermissions}
                  disabled={processingId !== null}
                  className="flex-1 py-5 text-sm font-black text-white bg-violet-600 hover:bg-violet-700 transition disabled:opacity-50"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Toasts */}
      {toast &&
        createPortal(
          <div
            className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl z-[9999] animate-in slide-in-from-bottom-5 ${
              toast.type === "success"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-bold text-sm">{toast.msg}</span>
          </div>,
          document.body,
        )}
    </main>
  );
}
