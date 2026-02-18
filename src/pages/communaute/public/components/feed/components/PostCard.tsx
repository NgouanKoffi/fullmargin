// src/pages/communaute/public/components/feed/components/PostCard.tsx
import { useMemo, useState, useRef, useEffect } from "react";
import type React from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  MessageSquare,
  Heart,
  ChevronRight as ChevronRightIcon,
  EllipsisVertical,
  Pencil,
  Trash2,
  Lock,
} from "lucide-react";
import type { PostLite } from "../types";
import { clampText } from "../utils";
import MediaLightbox from "../modals/MediaLightbox";
import CommentsModal from "../modals/CommentsModal";
import MediaGalleryInline from "../media/MediaGalleryInline";
import { togglePostLike, emitLikeChanged } from "../lib/likes";
import { useAuth } from "../../../../../../auth/AuthContext";

type Visibility = "private" | "public";

type PostMediaItem = {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
};

type PostCardProps = {
  post: PostLite & {
    likedByMe?: boolean;
    likes?: number;
    deletedAt?: string;
    visibility?: Visibility;
  };
  currentUserId?: string | null;
  canModerateThisPost?: boolean;
  canAdmin?: boolean;
  onEdit?: (post: PostLite) => void | Promise<void>;
  onDelete?: (post: PostLite) => void | Promise<void>;

  /** Infos communauté (flux multi-communautés) */
  communityId?: string;
  communityName?: string;
  communitySlug?: string;
  communityAvatarUrl?: string;
};

type UnknownRecord = Record<string, unknown>;
function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === "object" && v !== null;
}
function pickString(o: unknown, keys: string[]): string | null {
  if (!isRecord(o)) return null;
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}
function getAuthorId(post: PostLite): string | null {
  if (isRecord(post) && typeof post["authorId"] === "string")
    return String(post["authorId"]);
  const author = isRecord(post) ? (post["author"] as unknown) : undefined;
  if (typeof author === "string") return author;
  if (isRecord(author)) {
    const id = pickString(author, ["id", "_id", "userId", "uid"]);
    if (id) return id;
  }
  const flatId = pickString(post as unknown as UnknownRecord, [
    "userId",
    "uid",
    "ownerId",
    "createdById",
  ]);
  return flatId ?? null;
}
function pickAuthorNameAvatar(post: PostLite): {
  name: string;
  avatar: string;
  isVerified: boolean;
} {
  const FALLBACK_NAME = "Utilisateur";
  const FALLBACK_AVATAR =
    "https://fullmargin-cdn.b-cdn.net/WhatsApp%20Image%202025-12-02%20%C3%A0%2008.45.46_8b1f7d0a.jpg";
  const rec = post as unknown as UnknownRecord;

  const flatName = pickString(rec, [
    "authorName",
    "author_fullname",
    "author_fullName",
    "author_username",
    "username",
    "displayName",
    "name",
  ]);
  const flatAvatar = pickString(rec, [
    "authorAvatarUrl",
    "authorAvatar",
    "author_avatar",
    "photoURL",
    "photoUrl",
    "photo",
    "picture",
    "image",
    "avatarUrl",
    "avatar",
  ]);

  const author = rec["author"] as unknown;

  if (typeof author === "string" && author.trim().length > 0) {
    return {
      name: author,
      avatar: flatAvatar || FALLBACK_AVATAR,
      isVerified:
        typeof rec["isVerified"] === "boolean"
          ? (rec["isVerified"] as boolean)
          : false,
    };
  }

  if (isRecord(author)) {
    const name =
      pickString(author, [
        "fullName",
        "fullname",
        "displayName",
        "name",
        "nickname",
        "userName",
      ]) ||
      flatName ||
      FALLBACK_NAME;

    const avatarFromAuthor =
      pickString(author, [
        "avatarUrl",
        "avatar",
        "authorAvatarUrl",
        "photoURL",
        "photoUrl",
        "photo",
        "picture",
        "image",
      ]) ||
      (isRecord(author["profile"])
        ? pickString(author["profile"] as UnknownRecord, [
            "avatarUrl",
            "avatar",
            "photoURL",
            "photoUrl",
            "photo",
            "picture",
            "image",
          ])
        : null);

    const avatar = avatarFromAuthor || flatAvatar || FALLBACK_AVATAR;

    const isVerified =
      (typeof rec["isVerified"] === "boolean"
        ? (rec["isVerified"] as boolean)
        : false) ||
      (typeof (author as UnknownRecord)["isVerified"] === "boolean"
        ? Boolean((author as UnknownRecord)["isVerified"])
        : false);

    return { name, avatar, isVerified };
  }

  return {
    name: flatName || FALLBACK_NAME,
    avatar: flatAvatar || FALLBACK_AVATAR,
    isVerified:
      typeof rec["isVerified"] === "boolean"
        ? (rec["isVerified"] as boolean)
        : false,
  };
}

function formatRelativeFR(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = Date.now();
  const diff = Math.max(0, now - d.getTime());
  const s = Math.floor(diff / 1000);
  if (s < 10) return "à l’instant";
  if (s < 60) return `il y a ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const dys = Math.floor(h / 24);
  if (dys === 1) return "hier";
  if (dys < 7) return `il y a ${dys} jours`;
  const w = Math.floor(dys / 7);
  if (w < 5) return `il y a ${w} sem.`;
  const mo = Math.floor(dys / 30);
  if (mo < 12) return `il y a ${mo} mois`;
  const y = Math.floor(dys / 365);
  return `il y a ${y} an${y > 1 ? "s" : ""}`;
}

export default function PostCard({
  post,
  currentUserId = null,
  canModerateThisPost = false,
  canAdmin = false,
  onEdit,
  onDelete,
  communityId,
  communityName,
  communitySlug,
  communityAvatarUrl,
}: PostCardProps) {
  const [expanded, setExpanded] = useState(false); // 🆕 mode "voir plus / voir moins"
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);
  const [likes, setLikes] = useState<number>(post.likes ?? 0);
  const [liked, setLiked] = useState<boolean>(!!post.likedByMe);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const { isAuthenticated } = useAuth();

  const isDeleted = !!post.deletedAt;

  const visibility: Visibility =
    (post.visibility === "public" || post.visibility === "private"
      ? post.visibility
      : "private") || "private";
  const isPrivatePost = !isDeleted && visibility === "private";

  const requireAuth = () => {
    try {
      const from =
        window.location.pathname +
        window.location.search +
        window.location.hash;
      localStorage.setItem("fm:auth:intent", from);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(
      new CustomEvent("fm:open-account", { detail: { mode: "signin" } })
    );
  };

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const media: PostMediaItem[] = Array.isArray(post.media)
    ? (post.media as PostMediaItem[])
    : [];
  const hasMedia = media.length > 0;
  const singleImage =
    hasMedia && media.length === 1 && media[0]?.type === "image";
  const singleVideo =
    hasMedia && media.length === 1 && media[0]?.type === "video";

  const {
    name: authorName,
    avatar: authorAvatar,
    isVerified,
  } = pickAuthorNameAvatar(post);

  const me = currentUserId ?? null;
  const authorId = getAuthorId(post);
  const isAuthor = !!me && !!authorId && String(authorId) === String(me);

  const canEdit = isAuthor && !isDeleted;
  const canDelete =
    (isAuthor || !!(canModerateThisPost || canAdmin)) && !isDeleted;
  const showMenu = (canEdit || canDelete) && !isDeleted;

  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.dataset.fallback !== "1") {
      img.src =
        "https://fullmargin-cdn.b-cdn.net/WhatsApp%20Image%202025-12-02%20%C3%A0%2008.45.46_8b1f7d0a.jpg";
      img.dataset.fallback = "1";
    }
  };

  const onToggleLike = async () => {
    if (isDeleted) return;
    if (!isAuthenticated) {
      requireAuth();
      return;
    }

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikes((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    emitLikeChanged({
      id: post.id,
      liked: nextLiked,
      likes: nextLiked ? likes + 1 : Math.max(0, likes - 1),
    });

    try {
      const server = await togglePostLike(post.id, nextLiked);
      if (server.likes !== null) {
        setLikes(server.likes);
        emitLikeChanged({
          id: post.id,
          liked: server.liked,
          likes: server.likes,
        });
      } else {
        emitLikeChanged({
          id: post.id,
          liked: nextLiked,
          likes: nextLiked ? likes + 1 : Math.max(0, likes - 1),
        });
      }
    } catch {
      setLiked((prev) => !prev);
      setLikes((prev) => (nextLiked ? Math.max(0, prev - 1) : prev + 1));
      emitLikeChanged({ id: post.id, liked, likes });
    }
  };

  const rawContent = post.content ?? "";
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(rawContent.trim());

  // texte "propre" pour mesurer la longueur
  const plainTextForClamp = useMemo(
    () =>
      isHtml
        ? rawContent
            .replace(/<\/?[^>]+(>|$)/g, "")
            .replace(/\s+/g, " ")
            .trim()
        : rawContent,
    [rawContent, isHtml]
  );

  const clamped = useMemo(
    () => clampText(plainTextForClamp, 200),
    [plainTextForClamp]
  );

  const hasCommunity = !!communityName;
  const communityHref = communitySlug
    ? `/communaute/${communitySlug}`
    : communityId
    ? `/communaute/${communityId}`
    : null;

  const avatarSrc = communityAvatarUrl || authorAvatar;
  const avatarAlt = hasCommunity
    ? `Logo de ${communityName}`
    : authorName
    ? `Avatar de ${authorName}`
    : "Avatar";

  return (
    <>
      <article
        className={`relative isolate overflow-visible rounded-2xl p-4 sm:p-5 transition ${
          isDeleted
            ? "bg-rose-50 ring-1 ring-rose-100 text-slate-600 dark:bg-rose-500/5 dark:ring-rose-500/25 dark:text-slate-100"
            : "bg-white/70 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10"
        }`}
      >
        {isDeleted && (
          <div className="absolute top-3 right-3 rounded-full bg-rose-100 text-rose-700 px-3 py-1 text-[11px] font-medium border border-rose-200 dark:bg-rose-500/15 dark:text-rose-50 dark:border-rose-500/40 backdrop-blur-sm">
            Publication supprimée
          </div>
        )}

        <header className="flex items-start gap-3">
          <img
            src={avatarSrc}
            onError={onImgError}
            alt={avatarAlt}
            className={`h-10 w-10 rounded-full object-cover ${
              isDeleted ? "opacity-80" : ""
            }`}
            loading="lazy"
            decoding="async"
          />
          <div className="min-w-0 flex-1">
            {/* 1ère ligne : nom communauté en priorité */}
            <div className="flex items-center gap-2">
              {hasCommunity ? (
                communityHref ? (
                  <Link
                    to={communityHref}
                    className={`font-semibold text-sm sm:text-base truncate ${
                      isDeleted ? "text-slate-700 dark:text-slate-50" : ""
                    }`}
                  >
                    {communityName}
                  </Link>
                ) : (
                  <h3
                    className={`font-semibold text-sm sm:text-base truncate ${
                      isDeleted ? "text-slate-700 dark:text-slate-50" : ""
                    }`}
                  >
                    {communityName}
                  </h3>
                )
              ) : (
                <h3
                  className={`font-semibold text-sm sm:text-base truncate ${
                    isDeleted ? "text-slate-700 dark:text-slate-50" : ""
                  }`}
                >
                  {authorName}
                </h3>
              )}

              {!isDeleted && isVerified && (
                <Sparkles className="h-4 w-4 text-violet-500" />
              )}
            </div>

            {/* sous-ligne : auteur */}
            {hasCommunity && (
              <div className="text-xs text-slate-500 dark:text-slate-300 truncate">
                par{" "}
                <span className="font-medium text-slate-700 dark:text-slate-50">
                  {authorName}
                </span>
              </div>
            )}

            {/* date + badge privé */}
            <div className="mt-0.5 flex items-center gap-2 text-xs">
              <time
                className={
                  isDeleted
                    ? "text-slate-400 dark:text-slate-300/70"
                    : "text-slate-500"
                }
                dateTime={post.createdAt}
                title={new Date(post.createdAt).toLocaleString()}
              >
                {formatRelativeFR(post.createdAt)}
              </time>

              {isPrivatePost && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-900 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide">
                  <Lock className="h-3 w-3" />
                  <span>Privé</span>
                </span>
              )}
            </div>
          </div>

          {showMenu && (
            <div ref={menuRef} className="relative ml-auto z-20">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                title="Options"
              >
                <EllipsisVertical className="h-5 w-5" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-10 z-30 w-44 overflow-hidden rounded-xl bg-white dark:bg-slate-900 ring-1 ring-black/10 dark:ring-white/10 shadow-xl"
                >
                  {canEdit && (
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        window.dispatchEvent(
                          new CustomEvent<{
                            id: string;
                            content: string;
                            visibility?: Visibility;
                            media?: PostMediaItem[];
                          }>("fm:community:post:edit", {
                            detail: {
                              id: post.id,
                              content: post.content ?? "",
                              visibility,
                              media,
                            },
                          })
                        );
                        if (onEdit) void onEdit(post);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10 inline-flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Modifier
                    </button>
                  )}
                  {canDelete && (
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        if (onDelete) void onDelete(post);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-500/10 inline-flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </header>

        {/* ====== CONTENU (avec Voir plus / Voir moins) ====== */}
        <div className="mt-3">
          <div className="mx-auto max-w-3xl">
            {isDeleted ? (
              <p className="text-sm italic text-slate-500 dark:text-slate-100/70">
                Cette publication a été supprimée par son auteur ou un
                administrateur.
              </p>
            ) : clamped.clamped ? (
              <>
                {expanded ? (
                  <>
                    {isHtml ? (
                      <div
                        className="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-img:rounded-lg"
                        dangerouslySetInnerHTML={{ __html: rawContent }}
                      />
                    ) : (
                      <p className="text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                        {rawContent}
                      </p>
                    )}
                    <button
                      onClick={() => setExpanded(false)}
                      className="mt-2 inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                    >
                      Voir moins{" "}
                      <ChevronRightIcon className="h-4 w-4 rotate-180" />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                      {clamped.short}
                    </p>
                    <button
                      onClick={() => setExpanded(true)}
                      className="mt-2 inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                    >
                      Voir plus <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
              </>
            ) : isHtml ? (
              <div
                className="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-img:rounded-lg"
                dangerouslySetInnerHTML={{ __html: rawContent }}
              />
            ) : (
              <p className="text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                {rawContent}
              </p>
            )}
          </div>
        </div>

        {/* ====== MÉDIAS ====== */}
        {!isDeleted &&
          hasMedia &&
          (singleImage ? (
            <div className="mt-3">
              <button
                onClick={() => {
                  setLbIndex(0);
                  setLbOpen(true);
                }}
                className="block w-full overflow-hidden rounded-xl ring-1 ring-black/5 dark:ring-white/10"
                aria-label="Ouvrir l’image"
              >
                <div className="relative w-full aspect-video bg-black/5 dark:bg-white/5">
                  <img
                    src={media[0]!.url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </button>
            </div>
          ) : singleVideo ? (
            <div className="mt-3">
              <div className="overflow-hidden rounded-xl ring-1 ring-black/5 dark:ring-white/10 bg-black/10">
                <video
                  src={media[0]!.url}
                  controls
                  className="w-full h-auto max-h-[520px] bg-black"
                  poster={media[0]!.thumbnail || undefined}
                />
              </div>
            </div>
          ) : (
            <MediaGalleryInline
              items={media}
              onOpenLightbox={(i) => {
                setLbIndex(i);
                setLbOpen(true);
              }}
            />
          ))}

        {/* ====== FOOTER ====== */}
        <footer className="relative z-auto mt-4 flex items-center gap-5 text-sm">
          <button
            onClick={onToggleLike}
            disabled={isDeleted}
            className={`inline-flex items-center gap-1 ${
              isDeleted
                ? "cursor-not-allowed opacity-40"
                : "hover:opacity-90 text-slate-600 dark:text-slate-300"
            }`}
            aria-label={liked ? "Retirer le like" : "Aimer"}
          >
            <Heart
              className={`h-5 w-5 ${
                liked
                  ? "fill-rose-500 text-rose-500"
                  : "text-slate-700 dark:text-slate-200"
              }`}
            />
            {likes}
          </button>

          <button
            onClick={() => setCommentsOpen(true)}
            className="inline-flex items-center gap-1 hover:opacity-90 text-slate-600 dark:text-slate-300"
            aria-label="Ouvrir les commentaires"
          >
            <MessageSquare className="h-4 w-4" /> {post.comments ?? 0}
          </button>
        </footer>
      </article>

      {/* Lightbox médias */}
      {!isDeleted && hasMedia && (
        <MediaLightbox
          open={lbOpen}
          onClose={() => setLbOpen(false)}
          items={media}
          startIndex={lbIndex}
        />
      )}

      {/* Commentaires */}
      <CommentsModal
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        post={post}
        moderation={{
          canModerate: !!(canModerateThisPost || canAdmin),
          postAuthorId: authorId,
          currentUserId: me,
        }}
        // 🟣 on réutilise exactement les mêmes infos que sur la card
        communityId={communityId}
        communityName={communityName}
        communitySlug={communitySlug}
        communityAvatarUrl={communityAvatarUrl}
      />
    </>
  );
}
