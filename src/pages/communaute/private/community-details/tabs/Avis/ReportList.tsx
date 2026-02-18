import type { ReviewUI } from "../../utils/mapping";

export default function ReviewList({
  reviews,
  currentUserId,
  isOwner,
  loading,
  onRemoveMine,
}: {
  reviews: ReviewUI[];
  currentUserId?: string | null;
  isOwner: boolean;
  loading: boolean;
  onRemoveMine: () => void | Promise<void>;
}) {
  if (loading) return <div className="text-sm opacity-70">Chargement…</div>;
  if (!reviews.length)
    return <div className="text-sm opacity-70">Aucun avis pour le moment.</div>;

  return (
    <div className="space-y-3">
      {reviews.map((r) => {
        const isMine = currentUserId && r.user?.id === currentUserId;
        return (
          <div
            key={r.id}
            className="rounded-xl ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-slate-900 p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={r.user?.avatarUrl || "/images/avatar.svg"}
                  alt=""
                  className="h-8 w-8 rounded-full ring-1 ring-black/10 dark:ring-white/10 object-cover"
                />
                <div>
                  <div className="text-sm font-medium">
                    {r.user?.name || "Utilisateur"}
                  </div>
                  <div className="text-xs opacity-60">
                    Note : {r.rating} / 5
                  </div>
                </div>
              </div>
              <div className="text-xs opacity-60">
                {new Date(r.createdAt).toLocaleString()}
              </div>
            </div>

            {r.message && <div className="text-sm">{r.message}</div>}

            {isMine && !isOwner && (
              <div>
                <button
                  onClick={() => void onRemoveMine()}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Supprimer mon avis
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
