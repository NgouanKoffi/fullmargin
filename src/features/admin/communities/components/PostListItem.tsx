// src/features/admin/communities/components/PostListItem.tsx
import { useEffect, useState } from "react";
import { Trash2, MessageSquare, Heart, User, MapPin, Eye, Sparkles } from "lucide-react";
import type { PostItem } from "../types";

const SEEN_KEY = "admin:seen_posts";

function getSeenSet(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}
function markSeen(id: string) {
  const s = getSeenSet();
  s.add(id);
  localStorage.setItem(SEEN_KEY, JSON.stringify([...s]));
}

type Props = {
  post: PostItem;
  onDelete: () => void;
  onView: () => void;
};

export function PostListItem({ post, onDelete, onView }: Props) {
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const seen = getSeenSet();
    if (!seen.has(post.id)) setIsNew(true);
  }, [post.id]);

  const handleView = () => {
    markSeen(post.id);
    setIsNew(false);
    onView();
  };

  const formattedDate = new Date(post.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const hasMedia = post.media && post.media.length > 0;
  const firstMedia = hasMedia ? post.media![0] : null;

  return (
    <div className={`group relative flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-skin-surface border shadow-sm hover:shadow-md transition ${isNew ? "border-violet-400/60 ring-1 ring-violet-400/30" : "border-skin-border/30 hover:border-violet-500/30"}`}>

      {/* 🆕 Badge Nouveau */}
      {isNew && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
          <Sparkles className="w-3 h-3" /> Nouveau
        </div>
      )}

      {/* 🖼️ Media Preview */}
      {hasMedia && (
        <div className="relative w-full md:w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-skin-inset ring-1 ring-skin-border/20">
          <img
            src={firstMedia?.thumbnail || firstMedia?.url}
            alt="Post media"
            className="w-full h-full object-cover"
          />
          {post.media!.length > 1 && (
            <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-md">
              +{post.media!.length - 1}
            </div>
          )}
        </div>
      )}

      {/* 📝 Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Auteur + date */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-200 dark:border-violet-500/20">
                {post.authorId?.avatarUrl ? (
                  <img src={post.authorId.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-skin-base truncate">{post.authorId?.fullName || "Auteur inconnu"}</p>
                <p className="text-[10px] text-skin-muted truncate">{post.authorId?.email || ""}</p>
              </div>
            </div>
            <div className="text-[10px] text-skin-muted whitespace-nowrap bg-skin-inset px-2 py-1 rounded-lg border border-skin-border/40">
              {formattedDate}
            </div>
          </div>

          {/* Communauté */}
          <div className="flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 font-medium mb-2">
            <MapPin className="w-3 h-3" />
            <span>Dans : {post.communityId?.name || "Communauté inconnue"}</span>
          </div>

          {/* Contenu HTML rendu proprement */}
          <div
            className="text-sm text-skin-base line-clamp-3 mb-3 prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content || "<em>Sans contenu</em>" }}
          />
        </div>

        {/* Stats + Actions */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-skin-border/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] text-skin-muted">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              {post.likesCount || 0}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-skin-muted">
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              {post.commentsCount || 0}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleView}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-skin-base bg-skin-surface border border-skin-border/40 rounded-xl hover:bg-skin-inset transition shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" /> Voir
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl hover:bg-red-100 transition shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
