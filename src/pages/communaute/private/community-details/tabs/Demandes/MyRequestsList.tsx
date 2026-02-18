// src/pages/communaute/private/community-details/tabs/Demandes/MyRequestsList.tsx
import { Loader2, User2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { MyRequestItem } from "../../services/requests.service";
import { markMyRequestNotificationsAsSeen } from "../../services/requests.service";
import EmptyState from "./ui/EmptyState";
import { FilterBar, FilterPill } from "./ui/FilterPills";

function normalizeStatus(
  raw: string | undefined | null
): "pending" | "approved" | "rejected" {
  const s = (raw || "").toLowerCase();
  if (
    s === "approved" ||
    s === "accepted" ||
    s === "acceptee" ||
    s === "acceptée"
  ) {
    return "approved";
  }
  if (
    s === "rejected" ||
    s === "refused" ||
    s === "refusee" ||
    s === "refusée"
  ) {
    return "rejected";
  }
  return "pending";
}

export default function MyRequestsList({
  loading,
  error,
  items,
  currentFilter,
  onChangeFilter,
  counts = { pending: 0, approved: 0, rejected: 0 },
}: {
  loading: boolean;
  error: string | null;
  items: MyRequestItem[];
  currentFilter: MyRequestItem["status"];
  onChangeFilter: (s: MyRequestItem["status"]) => void;
  counts?: { pending: number; approved: number; rejected: number };
}) {
  const handleFilterClick = async (next: MyRequestItem["status"]) => {
    onChangeFilter(next);

    // on essaye de dire au serveur “j’ai vu”
    try {
      await markMyRequestNotificationsAsSeen();
    } catch {
      // on ne bloque pas si ça rate
    }

    // et on prévient le reste du front
    window.dispatchEvent(new CustomEvent("fm:community-req-mark-read"));
  };

  return (
    <section>
      <FilterBar>
        <FilterPill
          active={currentFilter === "pending"}
          label={`En attente (${counts.pending})`}
          onClick={() => handleFilterClick("pending")}
        />
        <FilterPill
          active={currentFilter === "approved"}
          label={`Acceptées (${counts.approved})`}
          onClick={() => handleFilterClick("approved")}
        />
        <FilterPill
          active={currentFilter === "rejected"}
          label={`Refusées (${counts.rejected})`}
          onClick={() => handleFilterClick("rejected")}
        />
      </FilterBar>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-200 mt-3">
          <Loader2 className="w-4 h-4 animate-spin" />
          Chargement…
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200 border border-red-100/60 dark:border-red-500/30 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          title="Aucune demande"
          description="Aucune demande correspondant à ce filtre."
        />
      )}

      <div className="grid grid-cols-1 gap-3 mt-3">
        {items.map((it) => (
          <MyRequestCard key={it.id} item={it} />
        ))}
      </div>
    </section>
  );
}

function MyRequestCard({ item }: { item: MyRequestItem }) {
  const normalized = normalizeStatus(item.status);
  const approved = normalized === "approved";
  const avatar =
    item.community?.logoUrl && item.community.logoUrl.trim()
      ? item.community.logoUrl
      : null;

  const statusTone =
    normalized === "approved"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
      : normalized === "rejected"
      ? "bg-red-500/10 text-red-700 dark:text-red-200"
      : "bg-amber-500/10 text-amber-700 dark:text-amber-200";

  const content = (
    <div className="flex gap-3">
      <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-900/40 flex items-center justify-center overflow-hidden">
        {avatar ? (
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          <User2 className="w-5 h-5 opacity-70" />
        )}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-900 dark:text-white">
          {item.community?.name || "Communauté inconnue"}
        </div>
        {item.createdAt ? (
          <div className="text-xs text-slate-400">
            {new Date(item.createdAt).toLocaleString("fr-FR")}
          </div>
        ) : null}
        <div className="mt-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statusTone}`}
          >
            {normalized === "approved"
              ? "Acceptée"
              : normalized === "rejected"
              ? "Refusée"
              : "En attente"}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <article className="rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-100/60 dark:border-slate-800/40 p-4 hover:border-violet-300/60 dark:hover:border-violet-500/40 transition">
      {approved && item.community?.slug ? (
        <Link to={`/communaute/${item.community.slug}`}>{content}</Link>
      ) : (
        content
      )}
    </article>
  );
}
