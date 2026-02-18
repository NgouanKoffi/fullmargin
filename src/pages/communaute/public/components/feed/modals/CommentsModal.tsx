// src/pages/communaute/public/components/feed/modals/CommentsModal.tsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { X, Send } from "lucide-react";
import type { CommentLite, PostLite } from "../types";
import useKey from "../hooks/useKey";
import useLockBodyScroll from "../hooks/useLockBodyScroll";
import PostContent from "../components/PostContent";
import MediaLightbox from "./MediaLightbox";
import {
  listComments,
  createComment as apiCreateComment,
  editComment as apiEditComment,
  deleteComment as apiDeleteComment,
} from "../lib/comments";
import { loadSession } from "../../../../../../auth/lib/storage";
import { useAuth } from "../../../../../../auth/AuthContext";
import { API_BASE } from "../../../../../../lib/api";
import {
  AVATAR_FALLBACK,
  formatRelativeFR,
  getAvatar,
  uniqueById,
} from "./CommentsModal/commentUtils";
import AvatarImg from "./CommentsModal/AvatarImg";
import DeletedPostBanner from "./CommentsModal/DeletedPostBanner";
import CommentsTree from "./CommentsModal/CommentsTree";

// 👇 fichiers séparés dans le dossier "comments"

type ModerationInfo = {
  canModerate: boolean;
  postAuthorId?: string | null;
  currentUserId?: string | null;
};

export type CommentsModalProps = {
  open: boolean;
  onClose: () => void;
  post: PostLite & { deletedAt?: string };
  moderation?: ModerationInfo;

  // mêmes infos que dans PostCard
  communityId?: string;
  communityName?: string;
  communitySlug?: string;
  communityAvatarUrl?: string;
};

type AuthorLike = {
  fullName?: string;
  fullname?: string;
  displayName?: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  avatar?: string;
};

type PostWithAuthor = PostLite & {
  author?: AuthorLike | string | null;
  user?: AuthorLike | string | null;
  owner?: AuthorLike | string | null;
  authorName?: string;
};

export default function CommentsModal({
  open,
  onClose,
  post,
  moderation,
  communityId,
  communityName,
  communitySlug,
  communityAvatarUrl,
}: CommentsModalProps) {
  const [comments, setComments] = useState<CommentLite[]>([]);
  const [loading, setLoading] = useState(false);

  const [checkingRemote, setCheckingRemote] = useState(false);
  const [remoteDeleted, setRemoteDeleted] = useState(false);

  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(
    null
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  const [confirmId, setConfirmId] = useState<string | null>(null);

  const isPostDeletedFront = !!post.deletedAt;

  // ================== INFOS AUTEUR / COMMUNAUTÉ ==================
  const extendedPost = post as PostWithAuthor;
  const rawAuthor =
    extendedPost.author ?? extendedPost.user ?? extendedPost.owner ?? null;

  let authorName: string;
  let avatarSource: { avatarUrl?: string; avatar?: string } | undefined;

  if (typeof rawAuthor === "string") {
    authorName = rawAuthor || "Utilisateur";
    avatarSource = undefined;
  } else if (rawAuthor) {
    authorName =
      rawAuthor.fullName ||
      rawAuthor.fullname ||
      rawAuthor.displayName ||
      rawAuthor.name ||
      rawAuthor.username ||
      extendedPost.authorName ||
      "Utilisateur";
    avatarSource = {
      avatarUrl: rawAuthor.avatarUrl,
      avatar: rawAuthor.avatar,
    };
  } else {
    authorName = extendedPost.authorName || "Utilisateur";
    avatarSource = undefined;
  }

  const hasCommunity = !!communityName;
  const avatarSrc = communityAvatarUrl || getAvatar(avatarSource);
  const avatarAlt = hasCommunity
    ? `Logo de ${communityName}`
    : `Avatar de ${authorName}`;

  const communityHref = communitySlug
    ? `/communaute/${communitySlug}`
    : communityId
    ? `/communaute/${communityId}`
    : null;

  // ================== AUTH ==================
  const { isAuthenticated } = useAuth();
  const requireAuth = useCallback(() => {
    try {
      const from =
        window.location.pathname +
        window.location.search +
        window.location.hash;
      localStorage.setItem("fm:auth:intent", from);
    } catch {
      /* ignore */
    }
    onClose();
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("fm:open-account", { detail: { mode: "signin" } })
      );
    }, 0);
  }, [onClose]);

  const session = useMemo(
    () =>
      (loadSession() as {
        user?: {
          id?: string;
          fullName?: string;
          name?: string;
          avatarUrl?: string;
        };
      } | null) ?? null,
    []
  );
  const meId = (moderation?.currentUserId ?? session?.user?.id ?? "") as string;
  const meName = session?.user?.fullName || session?.user?.name || "";
  const meAvatar = session?.user?.avatarUrl || AVATAR_FALLBACK;

  useLockBodyScroll(open);
  useKey("Escape", () => open && onClose(), open);

  // ================== OUVERTURE → CHECK + COMMENTAIRES ==================
  useEffect(() => {
    if (!open) return;
    let aborted = false;

    (async () => {
      setCheckingRemote(true);
      setLoading(true);
      let deleted = isPostDeletedFront;

      // 1. check post
      try {
        const base = API_BASE.replace(/\/+$/, "");
        const res = await fetch(
          `${base}/communaute/posts/${encodeURIComponent(post.id)}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }
        );

        if (res.ok) {
          const json = (await res.json()) as {
            ok?: boolean;
            data?: { deletedAt?: string | null };
          };
          if (!aborted && json?.ok && json.data) {
            deleted = !!json.data.deletedAt;
          }
        } else if (res.status === 404) {
          if (!aborted) deleted = true;
        }
      } catch {
        // on laisse l’info du front
      }

      if (!aborted) {
        setRemoteDeleted(deleted);
      }

      // 2. commentaires
      try {
        const resp = await listComments({
          postId: post.id,
          page: 1,
          limit: 100,
          parentId: null,
          nestDepth: 2,
        });
        if (!aborted) {
          if (resp.ok) setComments(uniqueById(resp.data.items || []));
          else setComments([]);
        }
      } catch {
        if (!aborted) setComments([]);
      } finally {
        if (!aborted) {
          setLoading(false);
          setCheckingRemote(false);
        }
      }
    })();

    return () => {
      aborted = true;
    };
  }, [open, post.id, isPostDeletedFront]);

  const deletedFinal = isPostDeletedFront || remoteDeleted;

  // ================== AJOUT / ÉDITION ==================
  const addOrEdit = useCallback(async () => {
    const txt = draft.trim();
    if (!txt) return;
    if (deletedFinal) return;

    if (!isAuthenticated) {
      requireAuth();
      return;
    }

    // edit
    if (editingId) {
      const resp = await apiEditComment({ commentId: editingId, text: txt });
      if (resp.ok !== true) return;
      const updated = resp.data;
      const mapDeep = (arr: CommentLite[]): CommentLite[] =>
        arr.map((c) => {
          if (c.id === editingId) return { ...c, text: updated.text };
          if (c.replies?.length) return { ...c, replies: mapDeep(c.replies) };
          return c;
        });
      setComments((prev) => mapDeep(prev));
      setEditingId(null);
      setDraft("");
      return;
    }

    // create
    const resp = await apiCreateComment({
      postId: post.id,
      text: txt,
      parentId: replyTo?.id ?? null,
    });
    if (resp.ok !== true) return;
    const newItem = resp.data;

    setComments((prev) => {
      if (!replyTo) return uniqueById([newItem, ...prev]);
      const deep = (arr: CommentLite[]): CommentLite[] =>
        arr.map((c) => {
          if (c.id === replyTo.id) {
            const replies = c.replies
              ? uniqueById([newItem, ...c.replies])
              : [newItem];
            return { ...c, replies };
          }
          if (c.replies?.length) return { ...c, replies: deep(c.replies) };
          return c;
        });
      return deep(prev);
    });

    setDraft("");
    setReplyTo(null);
  }, [
    draft,
    deletedFinal,
    isAuthenticated,
    requireAuth,
    editingId,
    post.id,
    replyTo,
  ]);

  // ================== SUPPRESSION ==================
  const reallyDelete = useCallback(async () => {
    if (!confirmId) return;
    if (!isAuthenticated) {
      requireAuth();
      return;
    }
    const resp = await apiDeleteComment({ commentId: confirmId });
    if (resp.ok !== true) return;

    const removeDeep = (arr: CommentLite[]): CommentLite[] =>
      arr
        .map((c) =>
          c.id === confirmId
            ? null
            : {
                ...c,
                replies: c.replies ? removeDeep(c.replies) : undefined,
              }
        )
        .filter(Boolean) as CommentLite[];

    setComments((prev) => removeDeep(prev));
    setConfirmId(null);
  }, [confirmId, isAuthenticated, requireAuth]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pointer-events-auto fixed inset-0 m-0 grid grid-rows-[auto,1fr,auto] overflow-hidden bg-white dark:bg-[#0b0b0f]"
      >
        {/* Header du modal (barre du haut) */}
        <header className="flex items-center gap-3 px-4 sm:px-6 h-14 bg-white/90 dark:bg-[#0b0b0f]/90 border-b border-black/10 dark:border-white/10">
          <AvatarImg
            src={avatarSrc}
            alt={avatarAlt}
            className="h-9 w-9 rounded-full object-cover"
          />
          <div className="min-w-0">
            <div className="font-semibold leading-tight truncate">
              {hasCommunity ? (
                communityHref ? (
                  <Link to={communityHref}>{communityName}</Link>
                ) : (
                  communityName
                )
              ) : (
                authorName
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
              {hasCommunity && (
                <span className="truncate">par {authorName}</span>
              )}
              <time
                dateTime={post.createdAt}
                title={new Date(post.createdAt).toLocaleString()}
              >
                {formatRelativeFR(post.createdAt)}
              </time>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto inline-flex items-center justify-center rounded-xl h-9 w-9 ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg:white/10"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Body */}
        <div className="relative overflow-y-auto">
          <div className="px-4 sm:px-6 py-3 max-w-4xl mx-auto">
            <article className="rounded-2xl bg-white/70 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 p-4 sm:p-5">
              {/* entête interne, calquée sur la card */}
              <header className="flex items-start gap-3">
                <AvatarImg
                  src={avatarSrc}
                  alt={avatarAlt}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-sm sm:text-base truncate">
                      {hasCommunity ? (
                        communityHref ? (
                          <Link to={communityHref}>{communityName}</Link>
                        ) : (
                          communityName
                        )
                      ) : (
                        authorName
                      )}
                    </div>
                  </div>

                  {hasCommunity && (
                    <div className="text-xs text-slate-500 dark:text-slate-300 truncate">
                      par{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-50">
                        {authorName}
                      </span>
                    </div>
                  )}

                  <div className="mt-0.5 flex items-center gap-2 text-[11px] leading-none text-slate-500">
                    <time
                      dateTime={post.createdAt}
                      title={new Date(post.createdAt).toLocaleString()}
                    >
                      {formatRelativeFR(post.createdAt)}
                    </time>
                  </div>
                </div>
              </header>

              {deletedFinal && <DeletedPostBanner />}

              <PostContent
                post={post}
                clampLength={420}
                onOpenLightbox={(i) => {
                  setLbIndex(i);
                  setLbOpen(true);
                }}
              />
            </article>

            {/* Commentaires */}
            <div className="mt-2">
              <h4 className="text-sm font-semibold mb-3">
                Commentaires (
                {comments.reduce((n, c) => n + 1 + (c.replies?.length || 0), 0)}
                )
              </h4>

              {checkingRemote ? (
                <div className="text-sm text-slate-500">
                  Vérification de la publication…
                </div>
              ) : loading ? (
                <div className="text-sm text-slate-500">Chargement…</div>
              ) : comments.length === 0 ? (
                <div className="text-sm text-slate-500">
                  {deletedFinal
                    ? "Publication supprimée, aucun nouveau commentaire possible."
                    : "Aucun commentaire pour l’instant."}
                </div>
              ) : (
                <CommentsTree
                  nodes={comments}
                  meId={meId}
                  deletedFinal={deletedFinal}
                  isAuthenticated={isAuthenticated}
                  requireAuth={requireAuth}
                  setReplyTo={setReplyTo}
                  setEditingId={setEditingId}
                  setDraft={setDraft}
                  textareaRef={textareaRef}
                  setConfirmId={setConfirmId}
                  moderation={moderation}
                />
              )}
            </div>
          </div>
        </div>

        {/* Zone de saisie */}
        {!deletedFinal && (
          <div className="bg-gradient-to-t from-white/95 dark:from-[#0b0b0f]/95 to-transparent pt-2 pb-3">
            <div className="px-4 sm:px-6 max-w-4xl mx-auto">
              {replyTo && !editingId && (
                <div className="mb-1 text-xs text-slate-600 dark:text-slate-300">
                  Réponse à <span className="font-medium">{replyTo.name}</span>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="ml-2 text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    annuler
                  </button>
                </div>
              )}
              {editingId && (
                <div className="mb-1 text-xs text-slate-600 dark:text-slate-300">
                  Modification du commentaire
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setDraft("");
                    }}
                    className="ml-2 text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    annuler
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3 rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/80 dark:bg-white/5 p-2.5">
                <AvatarImg
                  src={meAvatar}
                  alt={meName || "Moi"}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={1}
                  placeholder={
                    isAuthenticated
                      ? "Écrire un commentaire…"
                      : "Connecte-toi pour écrire un commentaire…"
                  }
                  readOnly={!isAuthenticated}
                  onFocus={() => {
                    if (!isAuthenticated) requireAuth();
                  }}
                  className="flex-1 resize-none bg-transparent outline-none text-sm sm:text-[15px] leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500 whitespace-pre-wrap break-words"
                />
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      requireAuth();
                      return;
                    }
                    void addOrEdit();
                  }}
                  disabled={!draft.trim() || !isAuthenticated}
                  className={`inline-flex items-center justify-center h-10 w-10 rounded-full ${
                    draft.trim() && isAuthenticated
                      ? "bg-violet-600 text-white hover:bg-violet-700"
                      : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-500 cursor-not-allowed"
                  }`}
                  aria-label="Envoyer"
                  title="Envoyer"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* lightboxes */}
        {post.media && (
          <MediaLightbox
            open={lbOpen}
            onClose={() => setLbOpen(false)}
            items={post.media}
            startIndex={lbIndex}
          />
        )}

        {/* confirm delete */}
        {confirmId && (
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60"
            onClick={() => setConfirmId(null)}
          >
            <div
              className="w-[min(94vw,420px)] rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-black/10 dark:ring-white/10 p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-base font-semibold">
                Supprimer ce commentaire ?
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Cette action est définitive.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmId(null)}
                  className="px-3 py-2 rounded-lg ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Annuler
                </button>
                <button
                  onClick={() => void reallyDelete()}
                  className="px-3 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
