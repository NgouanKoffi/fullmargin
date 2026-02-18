// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\course\ReviewsBlock.tsx
import { useEffect, useMemo, useState } from "react";
import { Lock, SendHorizonal, Star as StarIcon } from "lucide-react";
import { API_BASE } from "../../lib/api";
import { loadSession } from "../../auth/lib/storage";

export type Review = {
  id: string;
  user?: { id?: string; name?: string; avatar?: string };
  rating: number; // 1..5
  comment: string;
  createdAt: string;
};

type SessionUser = {
  _id?: string;
  id?: string;
  name?: string;
  avatar?: string;
  roles?: string[];
};
type Session = {
  token?: string;
  user?: SessionUser;
} | null;

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function formatRelativeFR(dateIso: string): string {
  const now = Date.now();
  const t = new Date(dateIso).getTime();
  const diff = Math.max(0, now - t);
  const sec = Math.round(diff / 1000);
  if (sec < 5) return "à l'instant";
  if (sec < 60) return `il y a ${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `il y a ${d} j`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `il y a ${mo} mois`;
  const y = Math.round(mo / 12);
  return `il y a ${y} an${y > 1 ? "s" : ""}`;
}

/* UI Stars (RO) */
function StarRatingReadOnly({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div
      className="inline-flex items-center gap-1"
      title={`${rating.toFixed(1)}/5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          className={classNames(
            "h-4 w-4",
            i <= r ? "fill-amber-400 stroke-amber-400" : "stroke-slate-400"
          )}
        />
      ))}
    </div>
  );
}

/* UI Stars (input) */
function StarRatingInput({
  value,
  onChange,
  size = 18,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => {
        const active = i <= value;
        return (
          <button
            key={i}
            type="button"
            onClick={() => !disabled && onChange(i)}
            className="p-0.5"
            title={`${i} étoile${i > 1 ? "s" : ""}`}
            disabled={disabled}
          >
            <StarIcon
              className={classNames(
                "shrink-0",
                active ? "fill-amber-400 stroke-amber-400" : "stroke-slate-400",
                disabled && "opacity-60"
              )}
              style={{ width: size, height: size }}
            />
          </button>
        );
      })}
    </div>
  );
}

function MiniUser({
  name,
  avatar,
  right,
}: {
  name?: string;
  avatar?: string;
  right?: React.ReactNode;
}) {
  const initial = (name || "?")
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex items-center gap-3">
      {avatar ? (
        <img
          src={avatar}
          alt={name || "Utilisateur"}
          className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200/70 dark:ring-slate-700/60"
        />
      ) : (
        <div className="h-8 w-8 rounded-full grid place-items-center bg-slate-200/70 dark:bg-slate-700/60 text-[11px] font-semibold">
          {initial}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {name || "Utilisateur"}
        </div>
      </div>
      {right ? <div className="ml-auto">{right}</div> : null}
    </div>
  );
}

function authHeaders(): HeadersInit {
  const t = (loadSession() as Session)?.token ?? "";
  return t
    ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

export function ReviewsBlock({
  courseId,
  isAuthenticated,
  isOwner,
  isAdmin,
  enrolled,
  reviews,
  setReviews,
}: {
  courseId: string;
  isAuthenticated: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  enrolled: boolean;
  reviews: Review[];
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
}) {
  const session = loadSession() as Session;
  const meId: string | undefined = session?.user?._id || session?.user?.id;

  const [submittingReview, setSubmittingReview] = useState(false);

  // 🚨 Avis existant (unicité)
  const myExistingReview = useMemo(
    () =>
      reviews.find(
        (r) => r.user?.id && meId && String(r.user.id) === String(meId)
      ),
    [reviews, meId]
  );

  // Champs contrôlés (jamais vidés après submit)
  const [myRating, setMyRating] = useState<number>(
    myExistingReview?.rating || 0
  );
  const [myReview, setMyReview] = useState<string>(
    myExistingReview?.comment || ""
  );

  // Resync si l’avis existant change (ex: refetch)
  useEffect(() => {
    if (myExistingReview) {
      setMyRating(myExistingReview.rating || 0);
      setMyReview(myExistingReview.comment || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myExistingReview?.id]);

  const canReview = isAuthenticated && enrolled && !isOwner && !isAdmin;
  const isEditing = !!myExistingReview;

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!canReview) {
      alert(
        isOwner || isAdmin
          ? "L’auteur/administrateur ne peut pas laisser d’avis sur son cours."
          : !isAuthenticated
          ? "Connecte-toi pour laisser un avis."
          : "Inscris-toi pour laisser un avis."
      );
      return;
    }
    if (!myRating) {
      alert("Merci d’ajouter une note (étoiles).");
      return;
    }
    if (!myReview.trim()) {
      alert("Merci d’écrire un court commentaire.");
      return;
    }

    try {
      setSubmittingReview(true);

      const res = await fetch(
        `${API_BASE}/communaute/courses/${encodeURIComponent(
          courseId
        )}/reviews`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ rating: myRating, comment: myReview.trim() }),
        }
      );

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const msg =
          j?.message ||
          j?.error ||
          "Échec de l’envoi de l’avis. Réessaie dans un instant.";
        alert(msg);
        return;
      }

      const data = await res.json();
      const saved: Review = data?.data ?? data;

      // Remplacer l’avis de l’utilisateur (zéro doublon)
      setReviews((xs) => {
        const withoutMine = xs.filter(
          (r) => !(r.user?.id && meId && String(r.user.id) === String(meId))
        );
        return [saved, ...withoutMine];
      });

      // Ne pas vider myRating/myReview (persistance)
    } catch (e) {
      alert(
        e instanceof Error ? e.message : "Erreur lors de l’envoi de l’avis"
      );
    } finally {
      setSubmittingReview(false);
    }
  }

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
      : 0;

  return (
    <div className="w-full rounded-2xl ring-1 ring-slate-200/70 dark:ring-slate-700/60 bg-white/70 dark:bg-slate-900/60">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between p-4 sm:p-5 border-b border-slate-200/70 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <StarIcon className="h-5 w-5" />
          <h2 className="text-base font-semibold">Avis</h2>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden sm:inline text-slate-500">Moyenne</span>
          <StarRatingReadOnly rating={averageRating} />
          <span className="ml-1 text-xs text-slate-500">
            {reviews.length > 0 ? `${averageRating.toFixed(1)}/5` : "—"}
          </span>
        </div>
      </div>

      {/* Bandeau info si non autorisé */}
      {!canReview && (
        <div className="mx-4 mt-4 mb-0 rounded-lg ring-1 ring-slate-200/70 dark:ring-slate-700/60 p-3 text-xs flex items-start gap-2 text-slate-600 dark:text-slate-300">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            {isOwner || isAdmin
              ? "L’auteur/administrateur ne peut pas laisser un avis."
              : isAuthenticated
              ? "Inscris-toi à cette formation pour pouvoir laisser un avis."
              : "Connecte-toi ou crée un compte pour laisser un avis."}
          </span>
        </div>
      )}

      {/* Formulaire (mobile: boutons chacun sa ligne) */}
      <form onSubmit={handleSubmitReview} className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Vous
          </div>
          <StarRatingInput
            value={myRating}
            onChange={setMyRating}
            disabled={!canReview}
          />
        </div>

        <textarea
          value={myReview}
          onChange={(e) => setMyReview(e.target.value)}
          placeholder={
            canReview
              ? "Partage ton avis (note + texte requis)…"
              : "Avis réservé aux inscrits."
          }
          disabled={!canReview}
          className={classNames(
            "w-full min-h-[80px] resize-y rounded-lg bg-transparent ring-1 ring-slate-200/70 dark:ring-slate-700/60 px-3 py-2 text-sm outline-none",
            canReview
              ? "focus:ring-violet-500/60"
              : "opacity-60 cursor-not-allowed"
          )}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
          <button
            type="submit"
            disabled={
              !canReview || submittingReview || !myRating || !myReview.trim()
            }
            className={classNames(
              "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg",
              "bg-violet-600 text-white hover:bg-violet-700",
              (!canReview || submittingReview) &&
                "opacity-60 cursor-not-allowed"
            )}
            title={isEditing ? "Mettre à jour l'avis" : "Publier l'avis"}
          >
            <SendHorizonal className="h-4 w-4" />
            {isEditing ? "Mettre à jour l'avis" : "Publier l'avis"}
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Un seul avis par utilisateur (modifiable à tout moment).
        </p>
      </form>

      {/* Liste des avis */}
      <div className="p-4 sm:p-5 pt-0 space-y-3">
        {reviews.length === 0 ? (
          <div className="text-sm text-slate-500">
            Aucun avis pour le moment. Soyez le premier !
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-xl ring-1 ring-slate-200/70 dark:ring-slate-700/60 p-4 bg-white/50 dark:bg-slate-900/40"
            >
              <div className="flex items-start gap-3">
                <MiniUser
                  name={r.user?.name || "Membre"}
                  avatar={r.user?.avatar}
                  right={
                    <span className="text-xs text-slate-500">
                      {formatRelativeFR(r.createdAt)}
                    </span>
                  }
                />
              </div>
              <div className="mt-2">
                <StarRatingReadOnly rating={r.rating} />
              </div>
              {r.comment && (
                <p className="mt-2 text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                  {r.comment}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
