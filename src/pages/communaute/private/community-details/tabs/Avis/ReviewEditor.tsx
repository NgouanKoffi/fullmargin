// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\components\ReviewEditor.tsx
import { useState } from "react";
import type { ReviewUI } from "../../utils/mapping";

type ReviewDraft = { rating: 1 | 2 | 3 | 4 | 5; message: string };

export function ReviewEditor({
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: ReviewUI | null;
  onSave: (draft: ReviewDraft) => void | Promise<void>;
  onCancel: () => void;
  onDelete?: () => void | Promise<void>;
}) {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(initial?.rating ?? 5);
  const [message, setMessage] = useState<string>(initial?.message ?? "");
  const canSubmit = message.trim().length > 4;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        await onSave({ rating, message: message.trim() });
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <label className="text-xs text-slate-500">Note</label>
        <select
          className="w-full rounded-xl px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 bg-white dark:bg-slate-800 outline-none"
          value={rating}
          onChange={(e) =>
            setRating(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)
          }
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} ★
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-500">Message</label>
        <textarea
          rows={4}
          className="w-full rounded-xl px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 bg-white dark:bg-slate-800 outline-none"
          placeholder="Partage ton expérience…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        {initial && onDelete ? (
          <button
            type="button"
            onClick={() => void onDelete()}
            className="text-xs text-rose-600 hover:underline"
          >
            Supprimer mon avis
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 rounded-xl text-sm ring-1 ring-black/10 dark:ring-white/10"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              canSubmit
                ? "bg-violet-600 text-white hover:bg-violet-700"
                : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-500 cursor-not-allowed"
            }`}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </form>
  );
}
