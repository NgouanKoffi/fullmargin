// src/pages/communaute/public/components/feed/modals/comments/CommentInputBar.tsx
import AvatarImg from "./AvatarImg";
import { Send } from "lucide-react";

export default function CommentInputBar({
  meAvatar,
  meName,
  draft,
  setDraft,
  isAuthenticated,
  onRequireAuth,
  onSubmit,
  replyTo,
  onCancelReply,
  editingId,
  onCancelEdit,
}: {
  meAvatar: string;
  meName: string;
  draft: string;
  setDraft: (v: string) => void;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  onSubmit: () => void;
  replyTo: { id: string; name: string } | null;
  onCancelReply: () => void;
  editingId: string | null;
  onCancelEdit: () => void;
}) {
  return (
    <div className="bg-gradient-to-t from-white/95 dark:from-[#0b0b0f]/95 to-transparent pt-2 pb-3">
      <div className="px-4 sm:px-6 max-w-4xl mx-auto">
        {replyTo && !editingId && (
          <div className="mb-1 text-xs text-slate-600 dark:text-slate-300">
            Réponse à <span className="font-medium">{replyTo.name}</span>
            <button
              onClick={onCancelReply}
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
              onClick={onCancelEdit}
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
              if (!isAuthenticated) onRequireAuth();
            }}
            className="flex-1 resize-none bg-transparent outline-none text-sm sm:text-[15px] leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500 whitespace-pre-wrap break-words"
          />
          <button
            onClick={() => {
              if (!isAuthenticated) {
                onRequireAuth();
                return;
              }
              onSubmit();
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
  );
}
