import { memo, useEffect, useMemo, useState } from "react";
import Stars from "./Stars";
import {
  getProductReviews,
  postProductReview,
  type ProductReview,
  type ReviewsPayload,
} from "../../../lib/productApi";
import { loadSession } from "../../../../../auth/lib/storage";

// 🔓 helper pour ouvrir le modal d’auth
function openAuth(mode: "signin" | "signup" = "signin") {
  window.dispatchEvent(
    new CustomEvent("fm:open-account", { detail: { mode } })
  );
}

export type ReviewsPanelProps = {
  productId?: string;
  initialReviews?: ProductReview[];
  initialAverage?: number;
  initialCount?: number;
  currentUserId?: string | null;
  className?: string;
};

function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Une erreur est survenue";
}

const ReviewsPanel = memo(function ReviewsPanel({
  productId,
  initialReviews,
  initialAverage,
  initialCount,
  currentUserId,
  className = "",
}: ReviewsPanelProps) {
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews ?? []);
  const [avg, setAvg] = useState<number>(initialAverage ?? 0);
  const [count, setCount] = useState<number>(initialCount ?? reviews.length);
  const [myReview, setMyReview] = useState<ProductReview | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);

  const [note, setNote] = useState(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔒 état auth
  const session = loadSession();
  const isLoggedIn = !!session?.token;

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!productId) return;
      if (initialReviews) return;
      try {
        setFetching(true);
        setError(null);
        const data = await getProductReviews(productId);
        if (!alive) return;
        setReviews(data.reviews);
        setAvg(data.average);
        setCount(data.count);
        setMyReview(data.myReview);
        setIsOwner(!!data.isOwner);
        if (data.myReview) {
          setNote(data.myReview.rating);
          setComment(data.myReview.comment);
        }
      } catch (e: unknown) {
        if (alive)
          setError(getErrorMessage(e) || "Impossible de charger les avis");
      } finally {
        if (alive) setFetching(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [productId, initialReviews]);

  const breakdown = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((n) => reviews.filter((r) => r.rating === n).length),
    [reviews]
  );

  const alreadyReviewed = !!myReview;

  async function handleSubmit() {
    if (!isLoggedIn) {
      setError("Connectez-vous pour publier un avis.");
      openAuth("signin");
      return;
    }
    if (!comment.trim()) return;
    if (!productId) return;
    if (isOwner) return;

    setSending(true);
    try {
      const payload = { rating: note, comment: comment.trim() };
      const res = await postProductReview(productId, payload);

      setAvg(res.average);
      setCount(res.count);
      setMyReview(res.myReview);
      if (typeof (res as ReviewsPayload).isOwner === "boolean") {
        setIsOwner(!!(res as ReviewsPayload).isOwner);
      }

      setReviews((prev) => {
        const myId = res.myReview?.id;
        const idx = prev.findIndex((r) => r.id === myId);
        const nextItem: ProductReview = {
          id: res.myReview?.id || "me",
          user: res.myReview?.user || currentUserId || "me",
          userName: res.myReview?.userName,
          rating: payload.rating,
          comment: payload.comment,
          createdAt: new Date().toISOString(),
        };
        if (idx >= 0) {
          const clone = prev.slice();
          clone[idx] = nextItem;
          return clone;
        }
        return [nextItem, ...prev];
      });
      setError(null);
    } catch (e: unknown) {
      const msg = getErrorMessage(e);
      if (msg.toLowerCase().includes("propre produit")) {
        setIsOwner(true);
      } else if (
        msg.toLowerCase().includes("non autorisé") ||
        msg.includes("401")
      ) {
        setError("Connectez-vous pour publier un avis.");
        openAuth("signin");
      } else {
        setError(msg || "Impossible d’enregistrer l’avis");
      }
    } finally {
      setSending(false);
    }
  }

  const headingId = `heading-avis-${productId ?? "unknown"}`;
  const sectionId = `avis-${productId ?? "unknown"}`;
  const formDisabled = isOwner || sending || fetching || !isLoggedIn;

  return (
    <section
      id={sectionId}
      aria-labelledby={headingId}
      className={`rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 p-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id={headingId} className="text-lg md:text-xl font-semibold">
            Avis des clients
          </h2>
          <div className="mt-1 flex items-center gap-3">
            <Stars value={avg || 0} size={18} showValue />
            <span className="text-sm opacity-80">({count} avis)</span>
          </div>
        </div>
      </div>

      {isOwner && (
        <div className="mt-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm px-3 py-2 ring-1 ring-amber-500/20">
          Vous ne pouvez pas noter votre propre produit.
        </div>
      )}

      {!isLoggedIn && (
        <div
          className="
      mt-3 flex items-center justify-between gap-2
      rounded-lg bg-neutral-100 dark:bg-neutral-800 px-3 py-2
      ring-1 ring-black/10 dark:ring-white/10
      max-[440px]:flex-col max-[440px]:items-stretch
    "
        >
          <div className="text-sm opacity-80">
            Connectez-vous pour laisser un avis.
          </div>

          <button
            type="button"
            onClick={() => openAuth("signin")}
            className="
        inline-flex items-center justify-center rounded-lg bg-violet-600
        px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700
        max-[440px]:w-full max-[440px]:mt-2
      "
          >
            Se connecter
          </button>
        </div>
      )}

      {error && !isOwner && (
        <div className="mt-3 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm px-3 py-2 ring-1 ring-rose-500/20">
          {error}
        </div>
      )}

      {/* Breakdown */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {[5, 4, 3, 2, 1].map((n, idx) => {
          const total = count || 1;
          const value = breakdown[idx] ?? 0;
          const pct = Math.round((value / total) * 100);
          return (
            <div key={n} className="flex items-center gap-3">
              <span className="w-8 text-sm">{n}★</span>
              <div className="relative h-2 flex-1 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-amber-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs opacity-70">{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Formulaire */}
      <div
        className={`mt-5 rounded-xl ring-1 ring-black/10 dark:ring-white/10 p-3 ${
          !isLoggedIn
            ? "opacity-60 pointer-events-none"
            : "bg-white/80 dark:bg-neutral-900/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            {alreadyReviewed ? "Mettre à jour votre avis" : "Laisser un avis"}
          </div>
          {alreadyReviewed && (
            <span className="text-[11px] opacity-70">
              Un seul avis par utilisateur (rééditable)
            </span>
          )}
        </div>

        {/* ⬇️ Bloc note responsif */}
        <div
          className="
            mt-2 flex items-center gap-2
            flex-wrap
            max-[480px]:flex-col max-[480px]:items-start
          "
        >
          <label
            htmlFor={`note-select-${productId ?? "unknown"}`}
            className="text-sm"
          >
            Votre note :
          </label>

          <select
            id={`note-select-${productId ?? "unknown"}`}
            className="
              rounded-lg border border-black/10 dark:border-white/10
              bg-neutral-900 text-white
              px-2 py-1 text-sm appearance-none
              focus:outline-none focus:ring-2 focus:ring-violet-500/40
              disabled:opacity-60
              max-[480px]:w-full
            "
            value={note}
            onChange={(e) => setNote(Number(e.target.value))}
            disabled={formDisabled}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n} className="bg-neutral-900 text-white">
                {n}
              </option>
            ))}
          </select>

          <div className="max-[480px]:mt-1">
            <Stars value={note} />
          </div>
        </div>

        <textarea
          className="mt-3 w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
          rows={3}
          placeholder="Partagez votre expérience…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={formDisabled}
        />
        <div className="mt-2 flex justify-end gap-2">
          {alreadyReviewed && (
            <button
              type="button"
              className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm ring-1 ring-black/10 dark:ring-white/10 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-60"
              onClick={() => {
                setNote(5);
                setComment("");
                setMyReview(null);
              }}
              disabled={formDisabled}
            >
              Effacer mon brouillon
            </button>
          )}
          <button
            type="button"
            disabled={formDisabled || !comment.trim()}
            onClick={handleSubmit}
            className="inline-flex items-center rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
          >
            {alreadyReviewed ? "Mettre à jour" : "Publier"}
          </button>
        </div>
      </div>

      {/* Liste d'avis */}
      <div className="mt-6 space-y-3">
        {reviews.map((r) => {
          const displayName =
            r.userName ??
            (r.user === (currentUserId || "") ? "Vous" : "Utilisateur");
          return (
            <article
              key={r.id}
              className="rounded-lg ring-1 ring-black/10 dark:ring-white/10 p-3"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{displayName}</div>
                <div className="text-xs opacity-70">
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="mt-1">
                <Stars value={r.rating} />
              </div>
              <p className="mt-2 text-sm opacity-90 whitespace-pre-line">
                {r.comment}
              </p>
            </article>
          );
        })}
        {reviews.length === 0 && !fetching && (
          <div className="text-sm opacity-70">
            Aucun avis pour l’instant. Soyez le premier !
          </div>
        )}
      </div>
    </section>
  );
});

export default ReviewsPanel;
