// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\community-details\tabs\Formations\composants\ProgressSteps.tsx
import clsx from "clsx";

type Props = {
  step: number; // étape active (1-based)
  labels?: string[]; // optionnel
  total?: number; // alternatif à labels.length
  onJump?: (n: number) => void;
  className?: string;
  /** ✅ plus haut numéro d'étape accessible (1..total). Empêche de sauter trop loin */
  maxStepAllowed?: number;
};

export default function ProgressSteps({
  step,
  labels,
  total,
  onJump,
  className,
  maxStepAllowed = 1,
}: Props) {
  const count = labels?.length ?? total ?? 5;

  return (
    <div className={clsx("flex items-center gap-3", className)}>
      {Array.from({ length: count }, (_, i) => {
        const n = i + 1;
        const active = n === step;
        const locked = n > maxStepAllowed; // ✅ verrou
        return (
          <button
            key={n}
            type="button"
            onClick={() => !locked && onJump?.(n)}
            disabled={locked}
            className={clsx(
              "h-9 w-9 rounded-full text-sm font-medium transition",
              active
                ? "bg-violet-600 text-white"
                : "bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200",
              locked && "opacity-50 cursor-not-allowed"
            )}
            aria-current={active ? "step" : undefined}
            title={
              locked ? "Termine les étapes précédentes" : `Aller à l’étape ${n}`
            }
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
