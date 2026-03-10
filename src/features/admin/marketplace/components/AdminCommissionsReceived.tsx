import { useMemo, useState } from "react";
import { useAdminCommissions } from "../hooks/useAdminData";
import { RefreshCcw, Search, BadgePercent, Copy, Check, X } from "lucide-react";

/* =========================================================
   Commissions reçues — Vue list / lignes + modal user
========================================================= */

type Props = {
  /** Formateur monnaie hérité de la page parente (USD par défaut) */
  money: (n: number) => string;
};

type UserMini = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  roles?: string[];
};

function fmtDate(iso?: string | null) {
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
}

function CopyBtn({ text, label }: { text?: string | null; label: string }) {
  const [ok, setOk] = useState(false);
  const can = Boolean(text);
  return (
    <button
      type="button"
      disabled={!can}
      title={can ? `Copier ${label}` : "Indisponible"}
      onClick={async () => {
        try {
          if (!text) return;
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        } catch {
          /* noop */
        }
      }}
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg ring-1 transition
        ${
          can
            ? "ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/10"
            : "opacity-50 cursor-not-allowed ring-black/5 dark:ring-white/5"
        }`}
    >
      {ok ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      Copier
    </button>
  );
}

function UserModal({
  open,
  onClose,
  title,
  user,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  user: UserMini | null;
}) {
  if (!open || !user) return null;
  const roles = user.roles && user.roles.length > 0 ? user.roles : ["user"];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-black/10 dark:ring-white/10 p-4 md:p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base md:text-lg font-semibold">{title}</h3>
            <p className="text-xs opacity-70 mt-0.5">
              Détails de l&apos;utilisateur lié à cette commission.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white grid place-items-center text-lg font-semibold overflow-hidden">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              (user.fullName || "?")
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">
              {user.fullName || "Nom indisponible"}
            </div>
            <div className="text-xs opacity-70 truncate">{user.email}</div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <span className="text-xs opacity-60 block">Identifiant</span>
            <code className="text-[11px] break-all bg-black/5 dark:bg:white/10 rounded px-1.5 py-0.5">
              {user.id}
            </code>
          </div>
          <div>
            <span className="text-xs opacity-60 block mb-0.5">Rôles</span>
            <div className="flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-200"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
          {user.email && (
            <div>
              <span className="text-xs opacity-60 block mb-0.5">
                Contact rapide
              </span>
              <a
                href={`mailto:${user.email}`}
                className="inline-flex items-center text-xs text-violet-600 dark:text-violet-300 hover:underline break-all"
              >
                {user.email}
              </a>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3 rounded-xl text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCommissionsReceived({ money }: Props) {
  // ✅ Hook: shape réel exposé par useAdminCommissions
  const {
    params,
    setFilter,
    setPage,
    setLimit,
    items,
    page,
    limit,
    total,
    loading,
    error,
    reload,
  } = useAdminCommissions({ page: 1, limit: 25, sort: "createdAt:desc" });

  // états locaux filtrage
  const [q, setQ] = useState(params.q || "");
  const [df, setDf] = useState(params.dateFrom || "");
  const [dt, setDt] = useState(params.dateTo || "");

  // état modal user
  const [userModal, setUserModal] = useState<{
    open: boolean;
    kind: "seller" | "buyer";
    user: UserMini | null;
  }>({ open: false, kind: "seller", user: null });

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(total / Math.max(1, limit))),
    [total, limit]
  );

  const applyFilters = () => {
    setFilter({
      q: q || undefined,
      dateFrom: df || undefined,
      dateTo: dt || undefined,
      page: 1,
    });
  };

  const resetFilters = () => {
    setQ("");
    setDf("");
    setDt("");
    setFilter({
      q: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      page: 1,
    });
  };

  const changePage = (p: number) => {
    if (p < 1 || p > pageCount) return;
    setPage(p);
  };

  const changePageSize = (ps: number) => {
    setLimit(Math.max(5, Math.min(100, ps)));
    setPage(1);
  };

  // Total affiché = total de la page (le backend ne retourne pas de "totals")
  const totalPageAmount = useMemo(
    () => items.reduce((s, r) => s + (r.commissionAmount || 0), 0),
    [items]
  );

  const openUser = (kind: "seller" | "buyer", u: UserMini | undefined) => {
    if (!u) return;
    setUserModal({ open: true, kind, user: u });
  };

  const closeUser = () =>
    setUserModal((prev) => ({ ...prev, open: false, user: null }));

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl ring-1 ring-black/10 dark:ring:white/10 bg-white/70 dark:bg-neutral-900/60 p-4">
          <div className="text-xs opacity-70">Total (page)</div>
          <div className="mt-1 text-2xl font-bold">
            {money(totalPageAmount)}
          </div>
        </div>
        <div className="rounded-2xl ring-1 ring-black/10 dark:ring:white/10 bg-white/70 dark:bg-neutral-900/60 p-4">
          <div className="text-xs opacity-70">Entrées (total)</div>
          <div className="mt-1 text-2xl font-bold">{total}</div>
        </div>
      </div>

      {/* Filtres / actions */}
      <div className="rounded-2xl ring-1 ring-black/10 dark:ring:white/10 bg-white/70 dark:bg-neutral-900/60 p-3 md:p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs opacity-70 mb-1 block">Recherche</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 opacity-60" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Commande, produit, vendeur, acheteur…"
                className="w-full h-10 pl-8 pr-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/60 text-sm outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs opacity-70 mb-1 items-center gap-1">
              Du
            </label>
            <input
              type="date"
              value={df}
              onChange={(e) => setDf(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/60 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs opacity-70 mb-1 block">Au</label>
            <input
              type="date"
              value={dt}
              onChange={(e) => setDt(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-black/10 dark:border:white/10 bg-white/80 dark:bg-neutral-900/60 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs opacity-70 mb-1 block">Par page</label>
            <select
              value={limit}
              onChange={(e) => changePageSize(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl border border-black/10 dark:border:white/10 bg-white/80 dark:bg-neutral-900/60 text-sm"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={applyFilters}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700"
          >
            Appliquer
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={reload}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            title="Actualiser"
          >
            <RefreshCcw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="rounded-2xl ring-1 ring-red-300/50 bg-red-50/70 dark:bg-red-900/30 p-3 text-sm">
          {error}
        </div>
      )}

      {/* Liste en lignes */}
      <div className="space-y-2">
        {items.map((c: any) => {
          const sellerUser = c.sellerUser as UserMini | undefined;
          const buyerUser = c.buyerUser as UserMini | undefined;

          return (
            <article
              key={c.id}
              className="rounded-2xl ring-1 ring-black/10 dark:ring:white/10 bg-white/80 dark:bg-neutral-900/60 px-3 py-3 sm:px-4 sm:py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              {/* Bloc montant + devise + taux */}
              <div className="flex items-center gap-3 md:min-w-[180px]">
                <div>
                  <div className="text-[11px] opacity-60">Commission</div>
                  <div className="text-lg sm:text-xl font-extrabold tracking-tight">
                    {money(c.commissionAmount ?? 0)}
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-[11px]">
                  <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg ring-1 ring-black/10 dark:ring:white/10">
                    {(c.currency || "USD").toUpperCase()}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg ring-1 ring-black/10 dark:ring:white/10">
                    <BadgePercent className="w-3.5 h-3.5" />
                    {Math.max(0, c.commissionRate || 0)}%
                  </span>
                </div>
              </div>

              {/* Bloc centre : commande + produit */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="min-w-0">
                  <div className="opacity-60">Commande</div>
                  <div className="font-medium flex items-center gap-2">
                    <span className="truncate">{c.order || "—"}</span>
                    <CopyBtn text={c.order} label="la commande" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="opacity-60">Produit</div>
                  <div className="font-medium flex items-center gap-2">
                    <span className="truncate">{c.product || "—"}</span>
                    <CopyBtn text={c.product} label="le produit" />
                  </div>
                </div>
              </div>

              {/* Bloc droite : vendeur / acheteur / date / quantité */}
              <div className="flex flex-col items-start md:items-end gap-1 text-xs md:min-w-[190px]">
                <div className="flex flex-col md:flex-row xl:flex-col gap-1 md:gap-4 xl:gap-1 w-full md:w-auto">
                  <div className="max-w-full">
                    <span className="opacity-60">Vendeur&nbsp;:</span>{" "}
                    {sellerUser ? (
                      <button
                        type="button"
                        onClick={() => openUser("seller", sellerUser)}
                        className="inline-flex items-center text-[11px] font-semibold text-violet-600 dark:text-violet-300 hover:underline"
                      >
                        {sellerUser.fullName || "Voir fiche vendeur"}
                      </button>
                    ) : (
                      <span className="font-medium break-all">
                        {c.seller || "—"}
                      </span>
                    )}
                  </div>
                  <div className="max-w-full">
                    <span className="opacity-60">Acheteur&nbsp;:</span>{" "}
                    {buyerUser ? (
                      <button
                        type="button"
                        onClick={() => openUser("buyer", buyerUser)}
                        className="inline-flex items-center text-[11px] font-semibold text-violet-600 dark:text-violet-300 hover:underline"
                      >
                        {buyerUser.fullName || "Voir fiche acheteur"}
                      </button>
                    ) : (
                      <span className="font-medium break-all">
                        {c.buyer || "—"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 md:justify-end w-full md:w-auto mt-1">
                  <span>
                    Qté&nbsp;<b>{c.qty ?? 0}</b>
                  </span>
                  <span className="opacity-70">{fmtDate(c.createdAt)}</span>
                </div>
              </div>
            </article>
          );
        })}
        {items.length === 0 && !loading && (
          <div className="text-sm opacity-60 text-center py-6">
            Aucune commission trouvée.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs opacity-70">
        <div>
          Page {page} / {pageCount}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => changePage(page - 1)}
            disabled={page <= 1 || loading}
            className="h-8 px-3 rounded-lg ring-1 ring-black/10 dark:ring:white/10 disabled:opacity-50"
          >
            Précédent
          </button>
          <button
            type="button"
            onClick={() => changePage(page + 1)}
            disabled={page >= pageCount || loading}
            className="h-8 px-3 rounded-lg ring-1 ring-black/10 dark:ring:white/10 disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </div>

      {/* Modal fiche utilisateur */}
      <UserModal
        open={userModal.open}
        onClose={closeUser}
        title={userModal.kind === "seller" ? "Fiche vendeur" : "Fiche acheteur"}
        user={userModal.user}
      />
    </div>
  );
}
