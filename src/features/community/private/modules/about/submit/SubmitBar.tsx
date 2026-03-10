// src/pages/communaute/public/community-details/tabs/about/submit/SubmitBar.tsx
import { Loader2 } from "lucide-react";

export default function SubmitBar({
  canSubmit,
  submitting,
  createdOnce,
  serverError,
}: {
  canSubmit: boolean;
  submitting: boolean;
  createdOnce: boolean;
  serverError: string | null;
}) {
  return (
    <div className="pt-4 flex flex-col items-center gap-2">
      <button
        type="submit"
        aria-busy={submitting}
        disabled={!canSubmit || submitting}
        className={`inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold transition
          ${
            canSubmit && !submitting
              ? "bg-violet-600 text-white hover:bg-violet-700"
              : "bg-black/5 dark:bg-white/10 text-slate-400 cursor-not-allowed"
          } ${submitting ? "animate-pulse" : ""}`}
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {createdOnce ? "Mettre à jour" : "Créer la communauté"}
      </button>

      {serverError && (
        <div className="text-center pt-1 text-sm text-red-600 dark:text-red-400">
          {serverError}
        </div>
      )}
    </div>
  );
}
