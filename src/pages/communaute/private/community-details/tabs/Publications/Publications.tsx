// src/pages/communaute/private/community-details/tabs/Publications/Publications.tsx
import { useCallback, useEffect, useMemo, useState } from "react";

import { TabsHeader } from "./TabsHeader";
import { MyPostsList } from "./MyPostsList";
import {
  openAuthModal,
  dispatchFM,
  getAuthHeader,
  parseJsonSafe,
} from "./helpers";
import type { PublicationsProps, CreatePayload, ApiOk } from "./types";
import { API_BASE } from "../../../../../../lib/api";
import PostComposer from "../../../../public/components/feed/PostComposer";
import FeedList from "../../../../public/components/feed/components/FeedList";
import {
  SidebarCard,
  SimilarCommunities,
} from "../../../../public/components/feed/components/Sidebar";

export default function Publications({
  communityId,
  currentUserId,
  onRequireAuth,
  isAuthenticated,
  isOwner,
  isMember,
  allowSubscribersPosts,
}: PublicationsProps) {
  // 4 onglets
  const [active, setActive] = useState<"feed" | "mine" | "subs" | "deleted">(
    "feed"
  );

  // pour refresh le feed
  const [feedVersion, setFeedVersion] = useState(0);

  const handleCreate = useCallback(
    async (
      payload: CreatePayload
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

        // 🔥 IMPORTANT : envoyer la visibilité au backend
        fd.append(
          "visibility",
          payload.visibility === "public" ? "public" : "private"
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
    ]
  );

  const canSeeComposer =
    isAuthenticated && (isOwner || (isMember && allowSubscribersPosts));

  // 👉 nouveau : message rouge pour les abonnés quand l’admin refuse les posts
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
    (currentUserId && ownerId && currentUserId === ownerId) || forceSchedule
  );

  // refresh quand on créé / update
  useEffect(() => {
    const onCreated = () => {
      setFeedVersion((v) => v + 1);
    };
    const onUpdated = () => {
      setFeedVersion((v) => v + 1);
    };

    window.addEventListener(
      "fm:community:post:created",
      onCreated as EventListener
    );
    window.addEventListener(
      "fm:community:post:updated",
      onUpdated as EventListener
    );

    return () => {
      window.removeEventListener(
        "fm:community:post:created",
        onCreated as EventListener
      );
      window.removeEventListener(
        "fm:community:post:updated",
        onUpdated as EventListener
      );
    };
  }, []);

  // récupérer owner de la communauté
  useEffect(() => {
    let cancelled = false;
    async function getOwner() {
      setOwnerId(null);
      try {
        const r1 = await fetch(
          `${base}/communaute/communities/${communityId}`,
          { cache: "no-store" }
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
          { cache: "no-store" }
        );
        if (r2.ok) {
          const j2 = (await r2.json().catch(() => null)) as {
            data?: { items?: Array<{ id?: string; ownerId?: string }> };
          } | null;
          const it =
            j2?.data?.items?.find?.(
              (c: { id?: string }) => c?.id === communityId
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

      {/* ICI : même largeur que les autres tabs */}
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
              // 👇 ICI on ne montre pas les supprimées
              <div data-timeline-compact className="_gap flex flex-col gap-4">
                {/* Bandeau rouge pour les abonnés qui ne peuvent pas publier */}
                {showNoPostRightsNotice && (
                  <div className="rounded-2xl border border-rose-300/80 bg-rose-50/95 px-4 py-3 text-sm text-rose-800 dark:border-rose-700/70 dark:bg-rose-950/40 dark:text-rose-100">
                    Les publications dans cette communauté sont réservées à
                    l’administrateur. Vous ne pouvez pas publier ici.
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
                  <div className="rounded-2xl border border-slate-200/70 bg.white p-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                    Connectez-vous pour voir vos publications.
                  </div>
                )}
              </div>
            ) : active === "subs" ? (
              // publications d’abonnés → pas de supprimées non plus
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
                    Impossible d’identifier le propriétaire de la communauté.
                  </div>
                )}
              </div>
            ) : (
              // publications supprimées → uniquement les supprimées
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
              onAction={() => {
                /* future */
              }}
            >
              <SimilarCommunities />
            </SidebarCard>
          </aside>
        </div>
      </div>
    </>
  );
}
