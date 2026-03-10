// src/pages/communaute/public/components/feed/modals/comments/CommentsTree.tsx
import { useMemo, useState } from "react";
import { CornerDownRight } from "lucide-react";
import AvatarImg from "./AvatarImg";
import CommentMenu from "./CommentMenu";
import { formatRelativeFR, getAvatar } from "./commentUtils";
import type { CommentLite } from "../../types";
import { clampText } from "../../utils";

type CommentsTreeProps = {
  nodes?: CommentLite[];
  topId?: string;
  meId: string;
  deletedFinal: boolean;
  isAuthenticated: boolean;
  requireAuth: () => void;
  setReplyTo: (v: { id: string; name: string } | null) => void;
  setEditingId: (id: string | null) => void;
  setDraft: (txt: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  setConfirmId: (id: string | null) => void;
  moderation?: {
    canModerate: boolean;
    postAuthorId?: string | null;
  };
};

/** 🔹 Texte de commentaire avec Voir plus / Réduire inline */
function CommentBody({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  const clamped = useMemo(() => clampText(text, 260), [text]);

  if (!text) return null;

  return (
    <>
      <p className="mt-2 text-sm whitespace-pre-wrap break-words">
        {expanded || !clamped.clamped ? text : clamped.short}
      </p>

      {clamped.clamped && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
        >
          {expanded ? "Réduire" : "Voir plus"}
        </button>
      )}
    </>
  );
}

export default function CommentsTree({
  nodes,
  topId,
  meId,
  deletedFinal,
  isAuthenticated,
  requireAuth,
  setReplyTo,
  setEditingId,
  setDraft,
  textareaRef,
  setConfirmId,
  moderation,
}: CommentsTreeProps) {
  const list = Array.isArray(nodes) ? nodes : [];

  const isPostAuthor = (uid?: string | null) =>
    !!uid &&
    !!moderation?.postAuthorId &&
    String(uid) === String(moderation.postAuthorId);

  return (
    <ul className="space-y-4">
      {list.map((c) => {
        const isTop = !topId;
        const parentTopId = isTop ? c.id : (topId as string);

        const isCommentAuthor =
          !!meId && !!c.author?.id && String(c.author.id) === String(meId);
        const isPostOwner = isPostAuthor(meId);
        const canUserModerate = !!moderation?.canModerate;

        const showMenu =
          !deletedFinal && (isCommentAuthor || isPostOwner || canUserModerate);
        const canEditThis = !deletedFinal && isCommentAuthor;
        const canDeleteThis =
          !deletedFinal && (isCommentAuthor || isPostOwner || canUserModerate);

        const replies = Array.isArray(c.replies) ? c.replies : [];

        return (
          <li key={c.id} className="flex items-start gap-3">
            <AvatarImg src={getAvatar(c.author)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">
                    {c.author?.name ?? "Utilisateur"}
                  </div>
                  <time
                    className="mt-0.5 block text-[11px] leading-none text-slate-500"
                    dateTime={c.createdAt}
                    title={new Date(c.createdAt).toLocaleString()}
                  >
                    {formatRelativeFR(c.createdAt)}
                  </time>
                </div>

                {showMenu && (
                  <CommentMenu
                    canEdit={canEditThis}
                    canDelete={canDeleteThis}
                    onEdit={() => {
                      if (!isAuthenticated) {
                        requireAuth();
                        return;
                      }
                      setEditingId(c.id);
                      setDraft(c.text);
                      setReplyTo(null);
                      setTimeout(() => textareaRef.current?.focus(), 0);
                    }}
                    onDelete={() => {
                      if (!isAuthenticated) {
                        requireAuth();
                        return;
                      }
                      setConfirmId(c.id);
                    }}
                  />
                )}
              </div>

              {/* 🔸 Texte du commentaire avec Voir plus / Réduire inline */}
              <CommentBody text={c.text} />

              {!deletedFinal && (
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        requireAuth();
                        return;
                      }
                      setEditingId(null);
                      setReplyTo({
                        id: parentTopId,
                        name: c.author?.name ?? "Utilisateur",
                      });
                      setTimeout(() => textareaRef.current?.focus(), 0);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                  >
                    <CornerDownRight className="h-3.5 w-3.5" />
                    Répondre
                  </button>
                </div>
              )}

              {isTop && replies.length > 0 && (
                <div className="mt-3 pl-4 border-l border-black/10 dark:border-white/10">
                  <CommentsTree
                    nodes={replies}
                    topId={c.id}
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
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
