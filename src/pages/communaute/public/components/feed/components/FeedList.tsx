// src/pages/communaute/public/components/feed/components/FeedList.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PostCard from "./PostCard";
import type { PostLite } from "../types";
import { API_BASE } from "../../../../../../lib/api";
import { loadSession } from "../../../../../../auth/lib/storage";

export type FeedListProps = {
  communityId: string;
  currentUserId: string | null;
  pageSize?: number;
  authorIdFilter?: string | undefined;
  onEditPost?: (post: PostLite) => void | Promise<void>;
  onDeletePost?: (post: PostLite) => void | Promise<void>;
  isCommunityAdmin?: boolean;
  excludeAuthorId?: string;
  showDeleted?: boolean; // affiche aussi les posts supprimés
  onlyDeleted?: boolean; // affiche uniquement les posts supprimés
  /** 🆕 scope pour backend : "my-communities" ou "public-others" */
  visibilityScope?: "my-communities" | "public-others" | null;
};

type Visibility = "private" | "public";

type ApiListOk = {
  ok: true;
  data: {
    items: (PostLite & {
      likedByMe?: boolean;
      likes?: number;
      visibility?: Visibility;
    })[];
    page: number;
    limit: number;
    hasMore: boolean;
    total: number;
  };
};
type ApiList = ApiListOk | { ok: false; error?: string };

function jsonSafe<T = unknown>(r: Response): Promise<T | null> {
  return r
    .json()
    .then((x) => x as T)
    .catch(() => null);
}

type CommunityMini = {
  id: string;
  ownerId?: string;
  name?: string;
  slug?: string;
  logoUrl?: string; // 🆕 on récupère aussi le logo
};

type PostWithCommunityId = PostLite & {
  communityId?: string;
  authorId?: string;
  author?: { id?: string };
  likedByMe?: boolean;
  likes?: number;
  comments?: number;
  isPublished?: boolean;
  publishedAt?: string | null;
  deletedAt?: string;
  visibility?: Visibility; // 🔐
};

function belongsToAuthor(p: unknown, authorId: string): boolean {
  if (!authorId) return false;
  if (!p || typeof p !== "object") return false;
  const obj = p as PostWithCommunityId;
  if (typeof obj.authorId === "string" && obj.authorId === authorId)
    return true;
  if (
    obj.author &&
    typeof obj.author.id === "string" &&
    obj.author.id === authorId
  )
    return true;
  return false;
}

// Skeleton
function FeedSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
      <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="h-3 w-11/12 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="h-40 w-full bg-slate-200/60 dark:bg-slate-800/50 rounded-xl" />
      <div className="flex gap-3 pt-1">
        <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
    </div>
  );
}

export default function FeedList({
  communityId,
  currentUserId,
  pageSize = 10,
  authorIdFilter,
  onEditPost,
  onDeletePost,
  excludeAuthorId,
  showDeleted = true,
  onlyDeleted = false,
  visibilityScope = null,
}: FeedListProps) {
  const [items, setItems] = useState<PostWithCommunityId[]>([]);
  const itemsRef = useRef<PostWithCommunityId[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [readyToShowEmpty, setReadyToShowEmpty] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const [ownerMap, setOwnerMap] = useState<Record<string, string>>({});
  const [communityNameMap, setCommunityNameMap] = useState<
    Record<string, string>
  >({});
  const [communitySlugMap, setCommunitySlugMap] = useState<
    Record<string, string>
  >({});
  const [communityLogoMap, setCommunityLogoMap] = useState<
    Record<string, string>
  >({}); // 🆕 logo par communauté

  const [confirmTarget, setConfirmTarget] = useState<PostLite | null>(null);

  const base = useMemo(() => API_BASE.replace(/\/+$/, ""), []);
  const softRefreshMs = 6000;

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const fetchOwners = useCallback(
    async (ids: string[]) => {
      const uniq = Array.from(new Set(ids.filter((x) => x)));
      const missing = uniq.filter(
        (id) =>
          !ownerMap[id] &&
          !communityNameMap[id] &&
          !communitySlugMap[id] &&
          !communityLogoMap[id]
      );
      if (missing.length === 0) return;
      try {
        const url = `${base}/communaute/communities/batch?ids=${missing.join(
          ","
        )}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          ok?: boolean;
          data?: { items?: CommunityMini[] };
        };
        const list = json?.data?.items || [];
        if (!list.length) return;
        const patchOwners: Record<string, string> = {};
        const patchNames: Record<string, string> = {};
        const patchSlugs: Record<string, string> = {};
        const patchLogos: Record<string, string> = {};
        for (const c of list) {
          if (!c.id) continue;
          if (c.ownerId) patchOwners[c.id] = c.ownerId;
          if (c.name) patchNames[c.id] = c.name;
          if (c.slug) patchSlugs[c.id] = c.slug;
          if (c.logoUrl) patchLogos[c.id] = c.logoUrl;
        }
        if (Object.keys(patchOwners).length) {
          setOwnerMap((prev) => ({ ...prev, ...patchOwners }));
        }
        if (Object.keys(patchNames).length) {
          setCommunityNameMap((prev) => ({ ...prev, ...patchNames }));
        }
        if (Object.keys(patchSlugs).length) {
          setCommunitySlugMap((prev) => ({ ...prev, ...patchSlugs }));
        }
        if (Object.keys(patchLogos).length) {
          setCommunityLogoMap((prev) => ({ ...prev, ...patchLogos }));
        }
      } catch {
        /* ignore */
      }
    },
    [base, ownerMap, communityNameMap, communitySlugMap, communityLogoMap]
  );

  const fetchPage = useCallback(
    async (p: number) => {
      if (loading) return;
      setLoading(true);
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const qs = new URLSearchParams({
          communityId,
          page: String(p),
          limit: String(pageSize),
        });
        if (authorIdFilter) qs.set("authorId", authorIdFilter);
        if (visibilityScope) qs.set("scope", visibilityScope);

        // 🔐 on ajoute le token si dispo, pour que le backend sache si on est membre
        const token = (loadSession() as { token?: string } | null)?.token;
        const headers: HeadersInit = { Accept: "application/json" };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`${base}/communaute/posts?${qs.toString()}`, {
          method: "GET",
          headers,
          signal: ac.signal,
          cache: "no-store",
        });
        const parsed = (await jsonSafe<ApiList>(res)) as ApiList | null;
        if (!parsed || parsed.ok !== true) {
          if (p === 1) {
            setInitialLoading(false);
            setReadyToShowEmpty(true);
          }
          setLoading(false);
          return;
        }
        let newItems = parsed.data.items || [];

        if (authorIdFilter) {
          newItems = newItems.filter((it) =>
            belongsToAuthor(it, authorIdFilter)
          );
        }

        setItems((prev) =>
          p === 1
            ? (newItems as PostWithCommunityId[])
            : [...prev, ...(newItems as PostWithCommunityId[])]
        );

        const nextHasMore =
          parsed.data.hasMore && (!authorIdFilter || newItems.length > 0);
        setHasMore(nextHasMore);
        setPage(parsed.data.page);

        if (p === 1) {
          if (newItems.length === 0) {
            setReadyToShowEmpty(true);
          } else {
            setReadyToShowEmpty(false);
          }
        }

        const ids = (newItems as PostWithCommunityId[])
          .map((it) =>
            typeof it.communityId === "string" ? it.communityId : ""
          )
          .filter(Boolean);
        if (ids.length) void fetchOwners(ids);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
        if (p === 1) {
          setInitialLoading(false);
        }
      }
    },
    [
      base,
      communityId,
      pageSize,
      loading,
      fetchOwners,
      authorIdFilter,
      visibilityScope,
    ]
  );

  // soft refresh
  const softRefresh = useCallback(async () => {
    const idsOnScreen = itemsRef.current.map((x) => x.id);
    if (idsOnScreen.length === 0) return;

    try {
      const qs = new URLSearchParams({
        communityId,
        page: "1",
        limit: String(Math.max(pageSize, idsOnScreen.length)),
      });
      if (authorIdFilter) qs.set("authorId", authorIdFilter);
      if (visibilityScope) qs.set("scope", visibilityScope);

      const token = (loadSession() as { token?: string } | null)?.token;
      const headers: HeadersInit = { Accept: "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${base}/communaute/posts?${qs.toString()}`, {
        headers,
        cache: "no-store",
      });
      const parsed = (await jsonSafe<ApiList>(res)) as ApiList | null;
      if (!parsed || parsed.ok !== true) return;

      const fresh = parsed.data.items || [];
      const freshById = new Map(
        fresh.map((p) => [p.id, p as PostWithCommunityId])
      );

      setItems((prev) =>
        prev.map((old) => {
          const newer = freshById.get(old.id);
          if (!newer) return old;

          const next: PostWithCommunityId = { ...old };

          if (typeof newer.likes === "number") next.likes = newer.likes;
          if (typeof newer.likedByMe === "boolean")
            next.likedByMe = newer.likedByMe;
          if (typeof newer.comments === "number")
            next.comments = newer.comments;
          if (typeof newer.isPublished === "boolean")
            next.isPublished = newer.isPublished;
          if (newer.publishedAt !== undefined)
            next.publishedAt = newer.publishedAt;
          if (newer.deletedAt !== undefined) next.deletedAt = newer.deletedAt;
          if (newer.visibility !== undefined)
            next.visibility = newer.visibility; // 🔐 on met à jour la visibilité

          return next;
        })
      );
    } catch {
      /* ignore */
    }
  }, [authorIdFilter, base, communityId, pageSize, visibilityScope]);

  // reset + fetch initial
  useEffect(() => {
    setItems([]);
    itemsRef.current = [];
    setPage(1);
    setHasMore(true);
    setOwnerMap({});
    setCommunityNameMap({});
    setCommunitySlugMap({});
    setCommunityLogoMap({});
    setInitialLoading(true);
    setReadyToShowEmpty(false);
    void fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId, pageSize, authorIdFilter, visibilityScope]);

  // events from editor
  useEffect(() => {
    const onUpdated = (e: Event) => {
      const ce = e as CustomEvent<{
        id: string;
        content?: string;
        visibility?: Visibility;
      }>;
      if (!ce.detail?.id) return;
      setItems((prev) =>
        prev.map((p) =>
          p.id === ce.detail.id
            ? {
                ...p,
                content:
                  ce.detail.content !== undefined
                    ? ce.detail.content
                    : p.content,
                visibility:
                  ce.detail.visibility !== undefined
                    ? ce.detail.visibility
                    : p.visibility,
                isEdited: true,
              }
            : p
        )
      );
    };
    window.addEventListener("fm:community:post:updated", onUpdated);
    return () =>
      window.removeEventListener("fm:community:post:updated", onUpdated);
  }, []);

  // sync likes
  useEffect(() => {
    const onLike = (e: Event) => {
      const { id, liked, likes } =
        (e as CustomEvent<{ id: string; liked: boolean; likes: number }>)
          .detail || {};
      if (!id) return;
      setItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likedByMe: liked, likes } : p))
      );
    };
    window.addEventListener("fm:community:post:like", onLike as EventListener);
    return () =>
      window.removeEventListener(
        "fm:community:post:like",
        onLike as EventListener
      );
  }, []);

  // intervals/focus
  useEffect(() => {
    const t = window.setInterval(() => void softRefresh(), softRefreshMs);
    return () => window.clearInterval(t);
  }, [softRefresh]);

  useEffect(() => {
    const onFocus = () => void softRefresh();
    const onVis = () => {
      if (document.visibilityState === "visible") void softRefresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [softRefresh]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) void fetchPage(page + 1);
  }, [fetchPage, hasMore, loading, page]);

  const reallyDelete = useCallback(
    async (post: PostLite) => {
      const token = (loadSession() as { token?: string } | null)?.token;
      if (!token) {
        setConfirmTarget(null);
        return;
      }
      try {
        const res = await fetch(`${base}/communaute/posts/${post.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
        });
        if (res.ok) {
          setItems((prev) =>
            prev.map((p) =>
              p.id === post.id
                ? { ...p, deletedAt: new Date().toISOString() }
                : p
            )
          );
        }
      } catch {
        /* ignore */
      } finally {
        setConfirmTarget(null);
      }
    },
    [base]
  );

  const doDelete = useCallback(
    async (post: PostLite) => {
      if (onDeletePost) {
        await onDeletePost(post);
        return;
      }
      setConfirmTarget(post);
    },
    [onDeletePost]
  );

  const doEdit = useCallback(
    (post: PostLite) => {
      if (onEditPost) return onEditPost(post);
      return;
    },
    [onEditPost]
  );

  const canModerate = useCallback(
    (post: PostLite) => {
      const p = post as PostWithCommunityId;
      const cid = typeof p.communityId === "string" ? p.communityId : "";
      if (!cid || !currentUserId) return false;
      const ownerId = ownerMap[cid];
      return !!ownerId && ownerId === currentUserId;
    },
    [ownerMap, currentUserId]
  );

  // filtrage final
  const visibleItems = useMemo(() => {
    let list = items;

    if (excludeAuthorId) {
      list = list.filter((row) => {
        const author = row.authorId || row.author?.id || "";
        return String(author) !== String(excludeAuthorId);
      });
    }

    if (onlyDeleted) {
      // on ne garde QUE les supprimées
      list = list.filter((row) => !!row.deletedAt);
      return list;
    }

    if (!showDeleted) {
      list = list.filter((row) => !row.deletedAt);
    }

    return list;
  }, [items, excludeAuthorId, showDeleted, onlyDeleted]);

  return (
    <>
      <div className="space-y-4">
        {initialLoading ? (
          <>
            <FeedSkeleton />
            <FeedSkeleton />
            <FeedSkeleton />
          </>
        ) : (
          <>
            {visibleItems.map((row) => {
              const cid =
                typeof row.communityId === "string" ? row.communityId : "";
              const communityName = cid ? communityNameMap[cid] : undefined;
              const communitySlug = cid ? communitySlugMap[cid] : undefined;
              const communityLogo = cid ? communityLogoMap[cid] : undefined;

              return (
                <PostCard
                  key={row.id}
                  post={row}
                  currentUserId={currentUserId ?? null}
                  canModerateThisPost={canModerate(row)}
                  onEdit={(p) => {
                    if (doEdit) void doEdit(p);
                  }}
                  onDelete={(p) => {
                    if (doDelete) void doDelete(p);
                  }}
                  communityId={cid || undefined}
                  communityName={communityName}
                  communitySlug={communitySlug}
                  communityAvatarUrl={communityLogo}
                />
              );
            })}

            {!initialLoading && visibleItems.length > 0 && hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loading}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
                    loading
                      ? "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-500 cursor-not-allowed"
                      : "bg-violet-600 text-white hover:bg-violet-700"
                  }`}
                >
                  {loading ? "Chargement…" : "Voir plus"}
                </button>
              </div>
            )}

            {!initialLoading &&
              !loading &&
              visibleItems.length === 0 &&
              readyToShowEmpty && (
                <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                  Aucune publication à afficher.
                </div>
              )}
          </>
        )}
      </div>

      {confirmTarget && (
        <div className="fixed inset-0 z-[130]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative h-full w-full flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-black/10 dark:ring-white/10 shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-black/10 dark:border-white/10">
                <h3 className="font-semibold">Confirmer la suppression</h3>
              </div>
              <div className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                Voulez-vous vraiment supprimer cette publication ?
              </div>
              <div className="px-5 py-4 flex items-center justify-end gap-2 border-t border-black/10 dark:border-white/10">
                <button
                  className="rounded-lg px-3.5 py-2 text-sm ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg_white/10"
                  onClick={() => setConfirmTarget(null)}
                >
                  Annuler
                </button>
                <button
                  className="rounded-lg px-3.5 py-2 text-sm font-medium bg-rose-600 text-white hover:bg-rose-700"
                  onClick={() => void reallyDelete(confirmTarget)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
