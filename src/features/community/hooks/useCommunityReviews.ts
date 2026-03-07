// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\utils\useCommunityReviews.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listCommunityReviews,
  upsertMyReview,
  deleteMyReview,
  type ReviewBE,
  type ReviewsListResponse,
} from "@features/community/api/reviews.api"; // <-- chemin private
import {
  mapReviewBEtoUI,
  averageRating,
  type ReviewUI,
} from "@features/community/utils/mapping";


function extractItems(resp: ReviewsListResponse): ReviewBE[] {
  return Array.isArray(resp.items) ? resp.items : [];
}

type ReviewDraft = { rating: 1 | 2 | 3 | 4 | 5; message: string };

export function useCommunityReviews(
  communityId: string,
  currentUserId?: string | null
) {
  const [items, setItems] = useState<ReviewUI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const resp = await listCommunityReviews(communityId);
      const be = extractItems(resp);
      // on mappe VERS le format UI
      setItems(be.map((r) => mapReviewBEtoUI(r, communityId)));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  // charger au montage
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // 👉 c’est ICI qu’on reconnait "mon" avis
  const myReview = useMemo(
    () =>
      currentUserId
        ? items.find((r) => r.user?.id === currentUserId) ?? null
        : null,
    [items, currentUserId]
  );

  const avg = useMemo(() => averageRating(items), [items]);

  // créer / modifier
  async function save(draft: ReviewDraft) {
    await upsertMyReview(communityId, draft);
    await refresh(); // on recharge la liste pour avoir la version complète
  }

  // supprimer (c’est ce que tu veux pour le bouton)
  async function remove(reviewId: string) {
    await deleteMyReview(reviewId);
    // on enlève du state direct
    setItems((prev) => prev.filter((r) => r.id !== reviewId));
  }

  return { items, loading, error, myReview, avg, save, remove, refresh };
}
