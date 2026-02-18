// src/pages/admin/marketplace/composants/ProductsTable.tsx
import { useMemo, useState } from "react";
import { ChevronDown, BadgeCheck, X, Store } from "lucide-react";

import SearchInput from "./ui/SearchInput";
import ReasonModal from "./ui/ReasonModal";
import ProductCard from "./ProductCard";
import type { ProductWithFeatured } from "./ProductCard";
import type { AdminProductItem } from "../api/types";

// Types locaux
type Group = {
  key: string;
  shopId: string;
  shopName: string;
  shopSlug: string;
  products: ProductWithFeatured[];
  stats: {
    total: number;
    published: number;
    pending: number;
    rejected: number;
    suspended: number;
    featured: number;
  };
};

type ReasonAction = "suspend" | "reject" | "delete";
type FilterType =
  | "published"
  | "pending"
  | "rejected"
  | "suspended"
  | "featured"
  | null;

// ✅ 1. Définition des couleurs partagées pour qu'elles soient identiques partout
const PILL_COLORS = {
  gray: "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100",
  green:
    "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300",
  amber: "bg-amber-200 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300",
  red: "bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-300",
  rose: "bg-rose-200 text-rose-900 dark:bg-rose-900/40 dark:text-rose-300",
  violet:
    "bg-violet-200 text-violet-900 dark:bg-violet-900/40 dark:text-violet-300",
};

// Composant Pill interactif (pour la barre principale)
const Pill = ({
  children,
  color,
  active = false,
  onClick,
  count,
}: {
  children: React.ReactNode;
  color: keyof typeof PILL_COLORS;
  active?: boolean;
  onClick?: () => void;
  count?: number;
}) => {
  const activeStyle = active
    ? "ring-2 ring-offset-1 ring-offset-white dark:ring-offset-neutral-900 ring-blue-500 font-bold shadow-md scale-105"
    : "hover:opacity-80 active:scale-95";

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] transition-all ${PILL_COLORS[color]} ${activeStyle}`}
    >
      {children}
      {count !== undefined && <span className="opacity-70">({count})</span>}
    </button>
  );
};

// ✅ 2. Composant MiniPill (pour les en-têtes de groupe)
// C'est un <span> donc valide dans un bouton, mais avec le style du Pill
const MiniPill = ({
  children,
  color,
  count,
}: {
  children: React.ReactNode;
  color: keyof typeof PILL_COLORS;
  count: number;
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border border-black/5 dark:border-white/5 ${PILL_COLORS[color]}`}
    >
      {children}
      <span className="opacity-80">({count})</span>
    </span>
  );
};

export default function ProductsTable({
  rows,
  money,
  onValidate,
  onSuspend,
  onReject,
  onEdit,
  onRemove,
  onRestore,
  onToggleBadge,
  onFeature,
  q,
  setQ,
  page,
  pageSize,
  total,
  onPageChange,
  loading,
}: {
  rows: AdminProductItem[];
  money: (n: number) => string;
  onValidate: (id: string) => void;
  onSuspend: (id: string, reason: string) => void;
  onReject?: (id: string, reason: string) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string, reason: string) => void;
  onRestore: (id: string) => void;
  onToggleBadge: (id: string) => void;
  onFeature: (id: string, next: boolean) => Promise<void>;
  q: string;
  setQ: (s: string) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  loading?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

  // -------- États locaux --------
  const [featureBusy, setFeatureBusy] = useState<Set<string>>(() => new Set());
  const [featureOverride, setFeatureOverride] = useState<
    Record<string, boolean | undefined>
  >(() => ({}));
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);

  const toggleFilter = (f: FilterType) => {
    setActiveFilter((prev) => (prev === f ? null : f));
  };

  // --- LOGIQUE FILTRAGE ---
  const filtered: ProductWithFeatured[] = useMemo(() => {
    let result = rows as ProductWithFeatured[];

    // 1. Recherche Textuelle
    const S = q.trim();
    if (S) {
      const terms: string[] = [];
      const reQuoted = /"([^"]+)"/g;
      let m: RegExpExecArray | null;
      const used: number[] = [];

      while ((m = reQuoted.exec(S))) {
        terms.push(m[1].trim());
        used.push(m.index, m.index + m[0].length);
      }
      const leftover =
        used.length === 0
          ? S
          : S.split("")
              .map((ch, i) => {
                for (let k = 0; k < used.length; k += 2) {
                  if (i >= used[k] && i < used[k + 1]) return " ";
                }
                return ch;
              })
              .join("");

      leftover
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => terms.push(t));

      const makeWordRegex = (term: string) => {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`\\b${escaped}\\b`, "i");
      };

      result = result.filter((p) => {
        const shop = p.shop?.name || "";
        const cat = p.category?.label || p.category?.key || "";
        const creatorName =
          p.createdBy?.name ||
          [p.createdBy?.firstName, p.createdBy?.lastName]
            .filter(Boolean)
            .join(" ")
            .trim();
        const creatorEmail = p.createdBy?.email || "";
        const creator = [creatorName, creatorEmail].filter(Boolean).join(" • ");
        const haystack = [p.title || "", shop, cat, creator, p.id || ""].join(
          " • ",
        );
        return terms.every((t) => makeWordRegex(t).test(haystack));
      });
    }

    // 2. Filtrage par statut
    if (activeFilter) {
      if (activeFilter === "featured") {
        result = result.filter(
          (p) => featureOverride[p.id] ?? p.featured ?? false,
        );
      } else {
        result = result.filter((p) => p.status === activeFilter);
      }
    }

    return result;
  }, [rows, q, activeFilter, featureOverride]);

  // --- TOTAUX ---
  const counts = useMemo(() => {
    let published = 0,
      pending = 0,
      rejected = 0,
      suspended = 0,
      featured = 0;

    for (const p of rows) {
      if (p.status === "published") published++;
      else if (p.status === "pending") pending++;
      else if (p.status === "rejected") rejected++;
      else if (p.status === "suspended") suspended++;
      if (featureOverride[p.id] ?? p.featured) featured++;
    }
    return {
      total: rows.length,
      published,
      pending,
      rejected,
      suspended,
      featured,
    };
  }, [rows, featureOverride]);

  // --- GROUPEMENT ---
  const groups = useMemo<Group[]>(() => {
    if (activeFilter !== null) return [];

    const map = new Map<string, Group>();
    for (const p of filtered) {
      const sid = p.shop?.id || "no-shop";
      const sname = p.shop?.name || "Sans boutique";
      const sslug = p.shop?.slug || "";
      if (!map.has(sid)) {
        map.set(sid, {
          key: sid,
          shopId: sid,
          shopName: sname,
          shopSlug: sslug,
          products: [],
          stats: {
            total: 0,
            published: 0,
            pending: 0,
            rejected: 0,
            suspended: 0,
            featured: 0,
          },
        });
      }
      const g = map.get(sid)!;
      g.products.push(p);
      g.stats.total++;
      if (p.status === "published") g.stats.published++;
      else if (p.status === "pending") g.stats.pending++;
      else if (p.status === "rejected") g.stats.rejected++;
      else if (p.status === "suspended") g.stats.suspended++;
      if (featureOverride[p.id] ?? p.featured) g.stats.featured++;
    }
    return Array.from(map.values()).sort((a, b) =>
      a.shopName.localeCompare(b.shopName, "fr"),
    );
  }, [filtered, featureOverride, activeFilter]);

  // Gestion ouverture/fermeture
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set());
  const toggle = (k: string) =>
    setOpenKeys((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  // ===== Reason modal state =====
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reasonAction, setReasonAction] = useState<ReasonAction>("reject");
  const [reasonForId, setReasonForId] = useState<string | null>(null);
  const [reasonForTitle, setReasonForTitle] = useState<string>("");
  const [reasonBusy, setReasonBusy] = useState(false);

  function openReason(a: ReasonAction, p: AdminProductItem) {
    setReasonAction(a);
    setReasonForId(p.id);
    setReasonForTitle(p.title);
    setReasonOpen(true);
  }
  function closeReason() {
    setReasonOpen(false);
    setReasonBusy(false);
    setReasonForId(null);
  }

  const confirmReason = async (reason: string) => {
    if (!reasonForId) return;
    try {
      setReasonBusy(true);
      if (reasonAction === "reject") {
        if (onReject) onReject(reasonForId, reason);
      } else if (reasonAction === "suspend") {
        onSuspend(reasonForId, reason);
      } else if (reasonAction === "delete") {
        onRemove(reasonForId, reason);
      }
      closeReason();
    } finally {
      setReasonBusy(false);
    }
  };

  async function handleFeatureToggle(id: string, next: boolean) {
    setFeatureBusy((prev) => {
      const n = new Set(prev);
      n.add(id);
      return n;
    });
    setFeatureOverride((prev) => ({ ...prev, [id]: next }));
    try {
      await onFeature(id, next);
    } catch {
      setFeatureOverride((prev) => ({ ...prev, [id]: !next }));
    } finally {
      setFeatureBusy((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  }

  return (
    <section className="rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-black/10 dark:ring-white/10 p-4 md:p-5 pb-8">
      {/* HEADER & FILTRES */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Modération produits</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {!activeFilter && (
            <>
              <button
                onClick={() => setOpenKeys(new Set(groups.map((g) => g.key)))}
                className="rounded-lg px-2.5 py-1.5 text-xs ring-1 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Tout ouvrir
              </button>
              <button
                onClick={() => setOpenKeys(new Set())}
                className="rounded-lg px-2.5 py-1.5 text-xs ring-1 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Tout fermer
              </button>
            </>
          )}
          <SearchInput value={q} onChange={setQ} placeholder="Rechercher…" />
        </div>
      </div>

      {/* BANDEAU STATS CLIQUABLE */}
      <div className="mb-6 flex flex-wrap items-center gap-2 select-none">
        <Pill
          color="gray"
          active={activeFilter === null}
          onClick={() => setActiveFilter(null)}
          count={counts.total}
        >
          Tous
        </Pill>

        <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800 mx-1" />

        <Pill
          color="green"
          active={activeFilter === "published"}
          onClick={() => toggleFilter("published")}
          count={counts.published}
        >
          Publiés
        </Pill>

        <Pill
          color="amber"
          active={activeFilter === "pending"}
          onClick={() => toggleFilter("pending")}
          count={counts.pending}
        >
          En attente
        </Pill>

        <Pill
          color="red"
          active={activeFilter === "rejected"}
          onClick={() => toggleFilter("rejected")}
          count={counts.rejected}
        >
          Rejetés
        </Pill>

        <Pill
          color="violet"
          active={activeFilter === "suspended"}
          onClick={() => toggleFilter("suspended")}
          count={counts.suspended}
        >
          Suspendus
        </Pill>

        <Pill
          color="green"
          active={activeFilter === "featured"}
          onClick={() => toggleFilter("featured")}
          count={counts.featured}
        >
          <BadgeCheck className="h-3.5 w-3.5" /> En avant
        </Pill>

        {activeFilter && (
          <button
            onClick={() => setActiveFilter(null)}
            className="ml-auto text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Effacer le filtre
          </button>
        )}
      </div>

      {/* --- AFFICHAGE --- */}

      {/* VUE FILTRÉE (GRILLE) */}
      {activeFilter ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-200">
          {filtered.length === 0 && (
            <div className="col-span-full py-10 text-center opacity-60">
              Aucun produit trouvé pour ce filtre.
            </div>
          )}
          {filtered.map((p) => (
            <div key={p.id} className="flex flex-col gap-1">
              <div className="px-1 flex items-center gap-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                <Store className="w-3 h-3" />
                <span className="truncate max-w-[200px]">
                  {p.shop?.name || "Boutique inconnue"}
                </span>
              </div>
              <ProductCard
                p={p}
                money={money}
                isFeatureBusy={featureBusy.has(p.id)}
                featureOverrideValue={featureOverride[p.id]}
                onValidate={onValidate}
                onEdit={onEdit}
                onRestore={onRestore}
                onToggleBadge={onToggleBadge}
                onFeatureToggle={handleFeatureToggle}
                onRequestAction={openReason}
              />
            </div>
          ))}
        </div>
      ) : (
        /* VUE GROUPÉE PAR BOUTIQUE */
        <div className="space-y-4">
          {groups.length === 0 && (
            <div className="py-10 text-center opacity-60">
              {loading ? "Chargement…" : "Aucun produit."}
            </div>
          )}

          {groups.map((g) => {
            const isOpen = openKeys.has(g.key);
            return (
              <div
                key={g.key}
                className="rounded-xl ring-1 bg-white dark:bg-neutral-900 overflow-hidden"
              >
                <button
                  className="w-full px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  onClick={() => toggle(g.key)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                      🛍️
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {g.shopName}
                      </div>
                      <div className="text-[11px] opacity-60 truncate">
                        {g.shopSlug || "—"}
                      </div>
                    </div>
                  </div>

                  {/* ✅ STATS STYLISÉES ICI */}
                  <div className="flex flex-wrap justify-start sm:justify-end gap-2 items-center">
                    {g.stats.published > 0 && (
                      <MiniPill color="green" count={g.stats.published}>
                        Publiés
                      </MiniPill>
                    )}
                    {g.stats.pending > 0 && (
                      <MiniPill color="amber" count={g.stats.pending}>
                        En attente
                      </MiniPill>
                    )}
                    {g.stats.rejected > 0 && (
                      <MiniPill color="red" count={g.stats.rejected}>
                        Rejetés
                      </MiniPill>
                    )}
                    {g.stats.suspended > 0 && (
                      <MiniPill color="violet" count={g.stats.suspended}>
                        Suspendus
                      </MiniPill>
                    )}
                    {g.stats.featured > 0 && (
                      <MiniPill color="green" count={g.stats.featured}>
                        <BadgeCheck className="h-3 w-3" /> En avant
                      </MiniPill>
                    )}

                    <ChevronDown
                      className={`ml-2 h-4 w-4 opacity-50 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 bg-neutral-50/50 dark:bg-black/20 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {g.products.map((p) => (
                        <ProductCard
                          key={p.id}
                          p={p}
                          money={money}
                          isFeatureBusy={featureBusy.has(p.id)}
                          featureOverrideValue={featureOverride[p.id]}
                          onValidate={onValidate}
                          onEdit={onEdit}
                          onRestore={onRestore}
                          onToggleBadge={onToggleBadge}
                          onFeatureToggle={handleFeatureToggle}
                          onRequestAction={openReason}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm bg-white/90 dark:bg-neutral-900/70 rounded-xl shadow-sm ring-1 px-4 py-3">
        <div className="opacity-70 whitespace-nowrap">
          Page {page} / {totalPages} — {total} éléments
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-lg px-3 py-1.5 ring-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
          >
            Précédent
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg px-3 py-1.5 ring-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </div>

      <ReasonModal
        open={reasonOpen}
        title={
          reasonAction === "suspend"
            ? `Motif de suspension — "${reasonForTitle}"`
            : reasonAction === "reject"
              ? `Motif de rejet — "${reasonForTitle}"`
              : `Motif de suppression — "${reasonForTitle}"`
        }
        placeholder={
          reasonAction === "suspend"
            ? "Expliquez la raison de la suspension…"
            : reasonAction === "reject"
              ? "Expliquez la raison du rejet…"
              : "Expliquez la raison de la suppression…"
        }
        actionLabel={
          reasonAction === "suspend"
            ? "Suspendre"
            : reasonAction === "reject"
              ? "Rejeter"
              : "Supprimer"
        }
        onCancel={closeReason}
        onSubmit={confirmReason}
        busy={reasonBusy}
      />
    </section>
  );
}
