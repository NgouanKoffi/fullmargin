export type ReviewListItem = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
  user: {
    id: string;
    fullName?: string; // parfois c’est ça
    name?: string; // parfois c’est ça (ton ancien mapping)
    avatarUrl?: string;
  } | null;
};

type ReviewListProps = {
  reviews: ReviewListItem[];
  currentUserId?: string | null;
  loading?: boolean;
  onRemoveMine?: (id: string) => void | Promise<void>;
};

function formatDate(d: string): string {
  try {
    const dt = new Date(d);
    const day = String(dt.getDate()).padStart(2, "0");
    const month = String(dt.getMonth() + 1).padStart(2, "0");
    const year = dt.getFullYear();
    const h = String(dt.getHours()).padStart(2, "0");
    const m = String(dt.getMinutes()).padStart(2, "0");
    const s = String(dt.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year} ${h}:${m}:${s}`;
  } catch {
    return d;
  }
}

export default function ReviewList({
  reviews,
  currentUserId,
  loading = false,
  onRemoveMine,
}: ReviewListProps) {
  if (loading) {
    return <div className="text-sm opacity-60">Chargement des avis…</div>;
  }

  if (!reviews || reviews.length === 0) {
    return <div className="text-sm opacity-60">Aucun avis pour l’instant.</div>;
  }

  return (
    <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
      {reviews.map((r) => {
        const isMine = currentUserId && r.user?.id === currentUserId;
        const canDelete = isMine && !!onRemoveMine;

        // 👇 clé importante : on prend d’abord fullName, sinon name
        const baseName = r.user?.fullName || r.user?.name || "Utilisateur";
        const displayName = isMine ? baseName || "Moi" : baseName;

        return (
          <article
            key={r.id}
            className="relative rounded-2xl bg-slate-950/10 dark:bg-slate-950/30 ring-1 ring-slate-950/10 dark:ring-white/5 backdrop-blur p-4 sm:p-5 flex flex-col gap-3"
          >
            <div className="flex items-start gap-3 pr-14">
              <div className="h-11 w-11 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                {r.user?.avatarUrl ? (
                  <img
                    src={r.user.avatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {displayName.charAt(0)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-300/80">
                  {formatDate(r.createdAt)}
                </p>
              </div>

              <div className="absolute top-4 right-4 inline-flex items-center justify-center rounded-full bg-slate-900/70 dark:bg-slate-900 text-white text-xs font-semibold px-3 py-1">
                {r.rating} / 5
              </div>
            </div>

            {r.comment ? (
              <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-100">
                {r.comment}
              </p>
            ) : (
              <p className="text-sm italic text-slate-500 dark:text-slate-400">
                (Pas de message)
              </p>
            )}

            {canDelete ? (
              <div className="pt-1">
                <button
                  onClick={() => onRemoveMine?.(r.id)}
                  className="inline-flex items-center justify-center rounded-xl bg-rose-500/15 dark:bg-rose-900/40 text-rose-600 dark:text-rose-50 px-4 py-2 text-sm font-medium hover:bg-rose-500/25 dark:hover:bg-rose-900/55 transition"
                >
                  Supprimer mon avis
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
