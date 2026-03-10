// src/pages/communaute/private/community-details/tabs/Publications/Publications.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { TabsHeader } from "./TabsHeader";
import { MyPostsList } from "./MyPostsList";
import {
  openAuthModal,
  dispatchFM,
  getAuthHeader,
  parseJsonSafe,
} from "./helpers";
import type { PublicationsProps, CreatePayload, ApiOk } from "./types";
import { API_BASE } from "@core/api/client";
import PostComposer from "@shared/components/feed/PostComposer";
import FeedList from "@shared/components/feed/components/FeedList";
import {
  SidebarCard,
  SimilarCommunities,
} from "@shared/components/feed/components/Sidebar";
import CommentsModal from "@shared/components/feed/modals/CommentsModal";
import type { PostLite } from "@shared/components/feed/types";

export default function Publications({
  communityId,
  currentUserId,
  onRequireAuth,
  isAuthenticated,
  isOwner,
  isMember,
  allowSubscribersPosts,
}: PublicationsProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [active, setActive] = useState<"feed" | "mine" | "subs" | "deleted">(
    "feed",
  );
  const [feedVersion, setFeedVersion] = useState(0);

  // ── Modal post ouvert depuis notification ──
  const [modalPost, setModalPost] = useState<PostLite | null>(null);
  const modalOpenedFromNotifRef = useRef(false); // pour savoir si on doit faire navigate(-1) à la fermeture

  // ── Écoute de fm:community:open-post ──
  // Dispatché par CommunityContentSwitch après 150ms de montage
  useEffect(() => {
    const handler = async (e: Event) => {
      const detail = (
        e as CustomEvent<{ postId?: string; communityId?: string }>
      ).detail;
      const postId = detail?.postId;
      if (!postId) return;

      // Récupère le post depuis l'API pour avoir toutes les données du modal
      try {
        const base = API_BASE.replace(/\/+$/, "");
        const res = await fetch(
          `${base}/communaute/posts/${encodeURIComponent(postId)}`,
          {
            headers: { Accept: "application/json" },
            cache: "no-store",
          },
        );
        if (!res.ok) return;
        const json = (await res.json()) as { ok?: boolean; data?: PostLite };
        if (json?.ok && json.data) {
          modalOpenedFromNotifRef.current = true;
          setModalPost(json.data);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("fm:community:open-post", handler as EventListener);
    return () =>
      window.removeEventListener(
        "fm:community:open-post",
        handler as EventListener,
      );
  }, []);

  // ── Fermeture du modal ──
  const handleModalClose = useCallback(() => {
    setModalPost(null);

    if (modalOpenedFromNotifRef.current) {
      modalOpenedFromNotifRef.current = false;
      // Retire postId de l'URL sans recharger la page, puis revient en arrière
      // vers /notifications (la page d'où on venait)
      navigate(-1);
    }
  }, [navigate]);

  // ── Nettoyage du postId dans l'URL une fois le modal ouvert ──
  // (évite de ré-ouvrir le modal si on navigue en avant/arrière dans l'historique)
  useEffect(() => {
    if (modalPost && searchParams.has("postId")) {
      const sp = new URLSearchParams(searchParams.toString());
      sp.delete("postId");
      window.history.replaceState(null, "", `?${sp.toString()}`);
    }
  }, [modalPost, searchParams]);

  const handleCreate = useCallback(
    async (
      payload: CreatePayload,
    ): Promise<{ ok: boolean; message?: string }> => {
      if (!isAuthenticated) {
        if (onRequireAuth) onRequireAuth();
        else openAuthModal("signin");
        return { ok: false, message: "Authentification requise" };
      }

      const canPostHere = isOwner || (isMember && allowSubscribersPosts);
      if (!canPostHere) {
        return {
          ok: false,
          message: "Publication non autorisée dans cette communauté.",
        };
      }
      if (!communityId) return { ok: false, message: "communityId manquant." };

      try {
        const fd = new FormData();
        fd.append("communityId", communityId);
        fd.append("content", payload.text || "");
        fd.append(
          "visibility",
          payload.visibility === "public" ? "public" : "private",
        );

        if (payload.scheduledAt !== undefined && payload.scheduledAt !== null) {
          fd.append("scheduledAt", payload.scheduledAt);
        }
        for (const f of payload.files || []) {
          fd.append("media", f);
        }

        const base = API_BASE.replace(/\/+$/, "");
        const resp = await fetch(`${base}/communaute/posts`, {
          method: "POST",
          headers: { ...getAuthHeader(), Accept: "application/json" },
          body: fd,
          cache: "no-store",
        });
        const j = await parseJsonSafe<ApiOk<Record<string, unknown>>>(resp);

        if (!resp.ok || (j && j.ok === false)) {
          const msg =
            (j && (j.error || j.message)) ||
            `Échec création post (HTTP ${resp.status})`;
          dispatchFM({
            name: "fm:toast",
            detail: {
              type: "error",
              title: "Échec",
              text: msg,
              autoClose: 3000,
              dedupeKey: "post:create:error",
            },
          });
          return { ok: false, message: msg };
        }

        if (j && j.data) {
          dispatchFM({
            name: "fm:community:post:created",
            detail: { post: j.data },
          });
        }
        dispatchFM({
          name: "fm:toast",
          detail: {
            type: "success",
            title: "Publication réussie",
            text: payload.scheduledAt ? "Post programmé" : "Post publié",
            autoClose: 2200,
            dedupeKey: "post:created",
          },
        });
        return { ok: true, message: "Post publié" };
      } catch {
        dispatchFM({
          name: "fm:toast",
          detail: {
            type: "error",
            title: "Erreur réseau",
            text: "Impossible de publier pour le moment.",
            autoClose: 3000,
            dedupeKey: "post:create:network",
          },
        });
        return { ok: false, message: "Erreur réseau" };
      }
    },
    [
      allowSubscribersPosts,
      communityId,
      isAuthenticated,
      isMember,
      isOwner,
      onRequireAuth,
    ],
  );

  const canSeeComposer =
    isAuthenticated && (isOwner || (isMember && allowSubscribersPosts));
  const showNoPostRightsNotice =
    isAuthenticated && isMember && !isOwner && !allowSubscribersPosts;

  const [ownerId, setOwnerId] = useState<string | null>(null);
  const base = useMemo(() => API_BASE.replace(/\/+$/, ""), []);

  const forceSchedule = useMemo(() => {
    try {
      return localStorage.getItem("fm:forceSchedule") === "1";
    } catch {
      return false;
    }
  }, []);

  const canSchedule = Boolean(
    (currentUserId && ownerId && currentUserId === ownerId) || forceSchedule,
  );

  useEffect(() => {
    const onCreated = () => setFeedVersion((v) => v + 1);
    const onUpdated = () => setFeedVersion((v) => v + 1);
    window.addEventListener(
      "fm:community:post:created",
      onCreated as EventListener,
    );
    window.addEventListener(
      "fm:community:post:updated",
      onUpdated as EventListener,
    );
    return () => {
      window.removeEventListener(
        "fm:community:post:created",
        onCreated as EventListener,
      );
      window.removeEventListener(
        "fm:community:post:updated",
        onUpdated as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function getOwner() {
      setOwnerId(null);
      try {
        const r1 = await fetch(
          `${base}/communaute/communities/${communityId}`,
          { cache: "no-store" },
        );
        if (r1.ok) {
          const j1 = (await r1.json().catch(() => null)) as {
            data?: { ownerId?: string; owner?: { id?: string } };
            community?: { ownerId?: string; owner?: { id?: string } };
            ownerId?: string;
            owner?: { id?: string };
          } | null;
          const source = j1?.data ?? j1?.community ?? j1 ?? null;
          const oid1 =
            (source &&
              (typeof source.ownerId === "string"
                ? source.ownerId
                : source.owner && typeof source.owner.id === "string"
                  ? source.owner.id
                  : null)) ||
            null;
          if (!cancelled && oid1) {
            setOwnerId(oid1);
            return;
          }
        }
      } catch {
        /* ignore */
      }
      try {
        const r2 = await fetch(
          `${base}/communaute/communities/batch?ids=${communityId}`,
          { cache: "no-store" },
        );
        if (r2.ok) {
          const j2 = (await r2.json().catch(() => null)) as {
            data?: { items?: Array<{ id?: string; ownerId?: string }> };
          } | null;
          const it =
            j2?.data?.items?.find?.(
              (c: { id?: string }) => c?.id === communityId,
            ) ?? null;
          const oid2 = it && typeof it.ownerId === "string" ? it.ownerId : null;
          if (!cancelled && oid2) {
            setOwnerId(oid2);
            return;
          }
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setOwnerId(null);
    }
    void getOwner();
    return () => {
      cancelled = true;
    };
  }, [base, communityId]);

  return (
    <>
      {(active === "mine" || !canSeeComposer) && (
        <div style={{ display: "none" }}>
          <PostComposer
            onCreate={handleCreate}
            canManageVisibilityAndSchedule={isOwner}
          />
        </div>
      )}

      <style>{`
        [data-timeline-compact] ._gap { row-gap: 14px; }
        @media (min-width: 1024px){ [data-timeline-compact] img, [data-timeline-compact] video { max-height: 420px; } }
        @media (max-width: 1023.98px){ [data-timeline-compact] img, [data-timeline-compact] video { max-height: 60vh; } }
      `}</style>

      <div className="space-y-5 w-full">
        <TabsHeader
          active={active}
          setActive={setActive}
          showSubscribersTab={isOwner}
          showDeletedTab={isOwner}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr),360px] xl:grid-cols-[minmax(0,1fr),400px]">
          {/* colonne principale */}
          <div className="min-w-0">
            {active === "feed" ? (
              <div data-timeline-compact className="_gap flex flex-col gap-4">
                {showNoPostRightsNotice && (
                  <div className="rounded-2xl border border-rose-300/80 bg-rose-50/95 px-4 py-3 text-sm text-rose-800 dark:border-rose-700/70 dark:bg-rose-950/40 dark:text-rose-100">
                    Les publications dans cette communauté sont réservées à
                    l'administrateur. Vous ne pouvez pas publier ici.
                  </div>
                )}
                {canSeeComposer ? (
                  <PostComposer
                    onCreate={handleCreate}
                    canManageVisibilityAndSchedule={isOwner}
                  />
                ) : null}
                <FeedList
                  key={`feed-${communityId}-${feedVersion}`}
                  communityId={communityId}
                  currentUserId={currentUserId}
                  isCommunityAdmin={isOwner}
                  showDeleted={false}
                  onlyDeleted={false}
                />
              </div>
            ) : active === "mine" ? (
              <div data-timeline-compact className="_gap flex flex-col gap-4">
                {currentUserId ? (
                  <MyPostsList
                    communityId={communityId}
                    currentUserId={currentUserId}
                    canSchedule={canSchedule}
                  />
                ) : (
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                    Connectez-vous pour voir vos publications.
                  </div>
                )}
              </div>
            ) : active === "subs" ? (
              <div data-timeline-compact className="_gap flex flex-col gap-4">
                {ownerId ? (
                  <FeedList
                    key={`subs-${communityId}-${feedVersion}`}
                    communityId={communityId}
                    currentUserId={currentUserId}
                    isCommunityAdmin={isOwner}
                    excludeAuthorId={ownerId}
                    showDeleted={false}
                  />
                ) : (
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                    Impossible d'identifier le propriétaire de la communauté.
                  </div>
                )}
              </div>
            ) : (
              <div data-timeline-compact className="_gap flex flex-col gap-4">
                <FeedList
                  key={`deleted-${communityId}-${feedVersion}`}
                  communityId={communityId}
                  currentUserId={currentUserId}
                  isCommunityAdmin={isOwner}
                  showDeleted={true}
                  onlyDeleted={true}
                />
              </div>
            )}
            <div className="h-3" />
          </div>

          {/* sidebar */}
          <aside className="space-y-4">
            <SidebarCard
              title="Communautés similaires"
              icon={null}
              actionLabel="Explorer plus"
              onAction={() => {}}
            >
              <SimilarCommunities />
            </SidebarCard>
          </aside>
        </div>
      </div>

      {/* ── Modal post ouvert depuis notification ── */}
      {modalPost && (
        <CommentsModal
          open={true}
          onClose={handleModalClose}
          post={modalPost}
          moderation={{
            canModerate: isOwner,
            currentUserId: currentUserId ?? undefined,
          }}
          communityId={communityId}
        />
      )}
    </>
  );
}
