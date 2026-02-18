// src/pages/communaute/private/community-details/tabs/Demandes/MyCommunitiesList.tsx
import { Loader2, Users } from "lucide-react";
import { Link } from "react-router-dom";
import type { CommunityLite } from "../../services/requests.service";
import EmptyState from "./ui/EmptyState";

export default function MyCommunitiesList({
  loading,
  error,
  items,
  onUnsubscribe,
  leavingId,
}: {
  loading: boolean;
  error: string | null;
  items: CommunityLite[];
  onUnsubscribe?: (c: CommunityLite) => void;
  // id de la communauté qu’on est en train de quitter (pour le spinner)
  leavingId?: string | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-200">
        <Loader2 className="w-4 h-4 animate-spin" />
        Chargement…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200 border border-red-100/60 dark:border-red-500/30 px-4 py-3 text-sm">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Aucune communauté"
        description="Tu n’appartiens à aucune communauté pour l’instant."
        icon={<Users className="w-5 h-5" />}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((c) => {
        const isLeaving = leavingId === c.id;
        return (
          <Link
            key={c.id}
            // 🔥 on envoie vers la version PUBLIQUE
            to={`/communaute/${c.slug}`}
            className="rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-100/60 dark:border-slate-800/40 p-4 flex flex-col gap-3 sm:flex-row sm:items-center transition hover:border-violet-400/40 dark:hover:border-violet-500/40"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-900/40 flex items-center justify-center overflow-hidden shrink-0">
                {c.logoUrl ? (
                  <img
                    src={c.logoUrl}
                    alt={c.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Users className="w-5 h-5 opacity-70" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {c.name}
                </div>
                <div className="text-xs text-slate-400 break-all">
                  /communaute/{c.slug}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isLeaving && onUnsubscribe) {
                  onUnsubscribe(c);
                }
              }}
              disabled={isLeaving}
              className={`sm:ml-auto inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium transition self-start border ${
                isLeaving
                  ? "bg-rose-200/40 text-rose-600 dark:text-rose-200 cursor-not-allowed"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-200 border-rose-200/40 dark:border-rose-500/30 hover:bg-rose-500/20"
              }`}
            >
              {isLeaving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-2" />
                  Désabonnement…
                </>
              ) : (
                "Se désabonner"
              )}
            </button>
          </Link>
        );
      })}
    </div>
  );
}
