// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\tabs\AvisTab.tsx
import { useMemo, useState } from "react";
import { Star, ThumbsUp, Filter, Info } from "lucide-react";
import { Modal } from "./Avis/Modal";
import ReviewList, { type ReviewListItem } from "./Avis/ReviewList";
import { useCommunityReviews } from "../hooks/useCommunityReviews";
import { ReviewEditor } from "./Avis/ReviewEditor";
import MembersOnlyAlert from "../../../../../components/community/MembersOnlyAlert";

type AvisTabProps = {
  communityId: string;
  ownerId: string;
  isMember: boolean;
  currentUserId?: string | null;
  currentUserName?: string | null;
  onRequireAuth: () => void;
  isAuthenticated?: boolean;
  isOwner?: boolean;

  /** lancé quand l'utilisateur clique sur “Rejoindre la communauté” */
  onJoinCommunity?: () => void;

  /** pour adapter le wording si besoin */
  communityVisibility?: "public" | "private";
};

// On décrit ce que le hook nous renvoie pour 1 avis
type ReviewUI = {
  id: string;
  rating: number;
  comment?: string;
  content?: string;
  message?: string;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: string;
    fullName?: string;
    name?: string; // on l’ajoute ici aussi, au cas où
    avatarUrl?: string;
  } | null;
};

export default function AvisTab({
  communityId,
  ownerId,
  isMember,
  currentUserId,
  currentUserName,
  onRequireAuth,
  isAuthenticated,
  isOwner,
  onJoinCommunity,
  communityVisibility = "public",
}: AvisTabProps) {
  const [ratingFilter, setRatingFilter] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const effectiveIsAuthenticated =
    typeof isAuthenticated === "boolean" ? isAuthenticated : !!currentUserId;

  const effectiveIsOwner =
    typeof isOwner === "boolean"
      ? isOwner
      : effectiveIsAuthenticated && currentUserId === ownerId;

  const {
    items: reviews,
    loading: loadingReviews,
    error: errReviews,
    myReview,
    avg: avgRating,
    save: saveReview,
    remove,
  } = useCommunityReviews(communityId, currentUserId);

  const canCreateReview =
    effectiveIsAuthenticated && !effectiveIsOwner && isMember;

  // bannière “réservé aux membres” visible dès qu’on n’est pas membre
  const showMembersOnlyBanner = !effectiveIsOwner && !isMember;

  const membersOnlyDescription =
    communityVisibility === "private"
      ? "Seuls les membres acceptés peuvent laisser un avis sur cette communauté privée."
      : "Seuls les membres peuvent laisser un avis sur cette communauté.";

  const handleJoinFromBanner = () => {
    // pas connecté → on force d’abord la connexion
    if (!effectiveIsAuthenticated) {
      setHint(
        "Connectez-vous pour rejoindre cette communauté et laisser un avis."
      );
      onRequireAuth();
      return;
    }
    // connecté → on passe au flux d’abonnement
    if (onJoinCommunity) {
      onJoinCommunity();
    }
  };

  // 1. On trie + filtre, en typant comme ReviewUI[]
  const filteredReviews = useMemo<ReviewUI[]>(() => {
    const sorted = [...(reviews as ReviewUI[])].sort((a, b) =>
      a.createdAt && b.createdAt ? b.createdAt.localeCompare(a.createdAt) : 0
    );
    if (ratingFilter === 0) return sorted;
    return sorted.filter((r) => r.rating === ratingFilter);
  }, [reviews, ratingFilter]);

  // 2. On normalise dans le format attendu par ReviewList
  const normalizedReviews = useMemo<ReviewListItem[]>(() => {
    return filteredReviews.map((r) => {
      const isMine = myReview && r.id === myReview.id;

      // on récupère tout ce qui peut ressembler à un nom
      const fromUser =
        r.user &&
        ({
          id: r.user.id,
          fullName: r.user.fullName || r.user.name,
          avatarUrl: r.user.avatarUrl,
        } as const);

      let user: ReviewListItem["user"] =
        r.user && fromUser
          ? {
              id: fromUser.id,
              fullName: fromUser.fullName,
              avatarUrl: fromUser.avatarUrl,
            }
          : null;

      // si c'est mon avis mais pas de nom dans la réponse → on complète
      if (!user && isMine && currentUserId) {
        user = {
          id: currentUserId,
          fullName: currentUserName || "Moi",
          avatarUrl: undefined,
        };
      }

      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment ?? r.content ?? r.message ?? "",
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        user,
      };
    });
  }, [filteredReviews, myReview, currentUserId, currentUserName]);

  const openReview = () => {
    // non connecté → on ouvre le flux d’auth + petit message
    if (!effectiveIsAuthenticated) {
      setHint("Connectez-vous pour laisser un avis sur cette communauté.");
      onRequireAuth();
      return;
    }

    // connecté mais pas membre et pas encore d’avis → on bloque, mais SANS hint orange
    // la bannière MembersOnlyAlert suffit largement.
    if (!isMember && !myReview) {
      setHint(null);
      return;
    }

    setHint(null);
    setReviewModalOpen(true);
  };

  const buttonLabel = myReview ? "Modifier mon avis" : "Laisser un avis";

  return (
    <div className="w-full">
      <section
        className="space-y-4 sm:space-y-5"
        data-community-id={communityId}
      >
        {effectiveIsOwner && (
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-red-300/60 dark:bg-slate-900 dark:ring-red-700/40 p-6">
            <div className="text-red-700 dark:text-red-300 font-semibold">
              Vous êtes l’administrateur de cette communauté. Lecture seule.
            </div>
          </div>
        )}

        <div className="rounded-2xl p-3 ring-1 ring-black/5 bg-slate-950/10 dark:bg-slate-900/50 dark:ring-white/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium">Note moyenne</div>
            <div className="inline-flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold">
                {loadingReviews ? "—" : avgRating ? `${avgRating} / 5` : "—"}
              </span>
              <span className="text-xs opacity-70">
                {loadingReviews ? "Chargement…" : `(${reviews.length} avis)`}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 opacity-70" />
              <select
                className="h-8 rounded-lg px-2 ring-1 ring-black/10 dark:ring-white/10 bg-white/80 dark:bg-slate-800 text-sm"
                value={ratingFilter}
                onChange={(e) =>
                  setRatingFilter(
                    Number(e.target.value) as 0 | 1 | 2 | 3 | 4 | 5
                  )
                }
              >
                <option value={0}>Toutes</option>
                <option value={5}>5 ★</option>
                <option value={4}>4 ★</option>
                <option value={3}>3 ★</option>
                <option value={2}>2 ★</option>
                <option value={1}>1 ★</option>
              </select>
            </div>

            {!effectiveIsOwner && (
              <button
                onClick={openReview}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                  canCreateReview || myReview
                    ? "bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 cursor-not-allowed"
                }`}
                aria-disabled={!(canCreateReview || myReview)}
              >
                <ThumbsUp className="h-4 w-4" />
                {buttonLabel}
              </button>
            )}
          </div>
        </div>

        {/* 🔴 Bannière visible en permanence pour les non-membres */}
        {showMembersOnlyBanner && (
          <MembersOnlyAlert
            className="mt-1"
            title="Avis réservés aux membres"
            description={membersOnlyDescription}
            ctaLabel="Rejoindre la communauté"
            onCtaClick={handleJoinFromBanner}
          />
        )}

        {/* Hint UNIQUEMENT pour le cas “connectez-vous” */}
        {hint && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-200 dark:ring-amber-800/40 px-3 py-2 text-amber-800 dark:text-amber-200 text-sm inline-flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span>{hint}</span>
          </div>
        )}

        {errReviews && (
          <div className="text-sm text-red-600 dark:text-red-400">
            {errReviews}
          </div>
        )}

        <ReviewList
          reviews={normalizedReviews}
          currentUserId={currentUserId}
          loading={loadingReviews}
          onRemoveMine={async (id) => {
            if (id) {
              await remove(id);
              return;
            }
            if (myReview) {
              await remove(myReview.id);
            }
          }}
        />

        <Modal
          open={reviewModalOpen && (canCreateReview || !!myReview)}
          title={myReview ? "Modifier mon avis" : "Laisser un avis"}
          onClose={() => setReviewModalOpen(false)}
        >
          <ReviewEditor
            initial={myReview || null}
            onCancel={() => setReviewModalOpen(false)}
            onSave={async (d) => {
              await saveReview(d);
              setReviewModalOpen(false);
            }}
            onDelete={
              myReview
                ? async () => {
                    await remove(myReview.id);
                    setReviewModalOpen(false);
                  }
                : undefined
            }
          />
        </Modal>
      </section>
    </div>
  );
}
