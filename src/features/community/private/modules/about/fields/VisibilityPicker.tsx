import { Eye, Lock } from "lucide-react";

type Props = {
  value: "public" | "private";
  onChange: (v: "public" | "private") => void;
  // 👉 quand c’est à true, on montre le message et on bloque les boutons
  locked?: boolean;
};

export default function VisibilityPicker({
  value,
  onChange,
  locked = false,
}: Props) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-900 dark:text-slate-200">
        Statut de visibilité
      </label>

      <div className="mt-1 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => !locked && onChange("public")}
          disabled={locked}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 ring-1 text-sm transition
            ${
              value === "public"
                ? "bg-violet-600 text-white ring-violet-700"
                : "bg-white dark:bg-slate-900/40 text-slate-900 dark:text-slate-200 ring-black/10 dark:ring-white/10"
            }
            ${
              locked
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-white/80 dark:hover:bg-slate-900/60"
            }
          `}
        >
          <Eye className="h-4 w-4" /> Publique
        </button>

        <button
          type="button"
          onClick={() => !locked && onChange("private")}
          disabled={locked}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 ring-1 text-sm transition
            ${
              value === "private"
                ? "bg-violet-600 text-white ring-violet-700"
                : "bg-white dark:bg-slate-900/40 text-slate-900 dark:text-slate-200 ring-black/10 dark:ring-white/10"
            }
            ${
              locked
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-white/80 dark:hover:bg-slate-900/60"
            }
          `}
        >
          <Lock className="h-4 w-4" /> Privée
        </button>
      </div>

      {locked && (
        <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
          ⚠️ Le statut de visibilité ne peut plus être modifié après la création
          de la communauté.
        </p>
      )}
    </div>
  );
}
