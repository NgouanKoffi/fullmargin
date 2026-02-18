// src/pages/communaute/private/community-details/tabs/Demandes/IncomingRequestsList.tsx
import { Loader2, Inbox, User2, Check, X } from "lucide-react";
import type {
  IncomingRequestItem,
  RequestFilter,
} from "../../services/requests.service";
import EmptyState from "./ui/EmptyState";
import { FilterBar, FilterPill } from "./ui/FilterPills";

export default function IncomingRequestsList({
  loading,
  error,
  requests,
  currentFilter,
  onChangeFilter,
  hasCommunity,
  onAction,
  actingId,
  counts = { pending: 0, approved: 0, rejected: 0 },
}: {
  loading: boolean;
  error: string | null;
  requests: IncomingRequestItem[];
  currentFilter: RequestFilter;
  onChangeFilter: (f: RequestFilter) => void;
  hasCommunity: boolean;
  onAction: (id: string, action: "approve" | "reject") => void;
  actingId: string | null;
  counts?: { pending: number; approved: number; rejected: number };
}) {
  return (
    <section>
      <FilterBar>
        <FilterPill
          active={currentFilter === "pending"}
          label={`En attente (${counts.pending})`}
          onClick={() => onChangeFilter("pending")}
        />
        <FilterPill
          active={currentFilter === "approved"}
          label={`Acceptées (${counts.approved})`}
          onClick={() => onChangeFilter("approved")}
        />
        <FilterPill
          active={currentFilter === "rejected"}
          label={`Refusées (${counts.rejected})`}
          onClick={() => onChangeFilter("rejected")}
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

      {!loading && !error && !hasCommunity && (
        <EmptyState
          title="Aucune communauté"
          description="Crée d’abord ta communauté pour recevoir des demandes."
          icon={<Inbox className="w-5 h-5" />}
        />
      )}

      {!loading && !error && hasCommunity && requests.length === 0 && (
        <EmptyState
          title="Aucune demande"
          description="Aucune demande correspondant à ce filtre."
          icon={<Inbox className="w-5 h-5" />}
        />
      )}

      <div className="grid grid-cols-1 gap-3 mt-3">
        {requests.map((req) => (
          <IncomingRequestCard
            key={req.id}
            item={req}
            onAction={onAction}
            acting={actingId === req.id}
          />
        ))}
      </div>
    </section>
  );
}

function IncomingRequestCard({
  item,
  onAction,
  acting,
}: {
  item: IncomingRequestItem;
  onAction: (id: string, action: "approve" | "reject") => void;
  acting: boolean;
}) {
  const avatar =
    item.user?.avatarUrl && item.user.avatarUrl.trim()
      ? item.user.avatarUrl
      : null;

  const tone =
    item.status === "approved"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
      : item.status === "rejected"
      ? "bg-red-500/10 text-red-700 dark:text-red-200"
      : "bg-amber-500/10 text-amber-700 dark:text-amber-200";

  return (
    <article className="rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-100/60 dark:border-slate-800/40 p-4 flex gap-3 items-start">
      <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-900/40 flex items-center justify-center overflow-hidden">
        {avatar ? (
          <img
            src={avatar}
            alt={item.user?.fullName}
            className="h-full w-full object-cover"
          />
        ) : (
          <User2 className="w-5 h-5 opacity-70" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900 dark:text-white">
          {item.user?.fullName || "Utilisateur inconnu"}
        </div>
        {item.requestedAt ? (
          <div className="text-xs text-slate-400">
            {new Date(item.requestedAt).toLocaleString("fr-FR")}
          </div>
        ) : null}
        {item.note ? (
          <p className="text-xs text-slate-500 dark:text-slate-200 mt-1 line-clamp-2">
            {item.note}
          </p>
        ) : null}
        <div className="mt-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${tone}`}
          >
            {item.status === "approved"
              ? "Acceptée"
              : item.status === "rejected"
              ? "Refusée"
              : "En attente"}
          </span>
        </div>
      </div>
      {/* actions seulement si la demande est encore en attente */}
      {item.status === "pending" ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onAction(item.id, "approve")}
            disabled={acting}
            className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
            title="Accepter"
          >
            {acting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onAction(item.id, "reject")}
            disabled={acting}
            className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
            title="Refuser"
          >
            {acting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        </div>
      ) : null}
    </article>
  );
}
