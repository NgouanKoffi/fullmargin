// src/pages/course/CourseDescription.tsx
import { RichTextBN } from "./CoursePlayer/RichTextBN";

type Props = {
  shortDesc?: string | null;
  description?: string | null; // JSON BlockNote ou texte brut (ancien cours)
};

export function CourseDescription({ shortDesc, description }: Props) {
  const hasShort = Boolean(shortDesc && shortDesc.trim().length > 0);
  const hasDesc = Boolean(description && description.trim().length > 0);

  if (!hasShort && !hasDesc) return null;

  return (
    <section className="mt-6">
      <div className="rounded-2xl ring-1 ring-slate-200/70 dark:ring-slate-700/60 bg-white/90 dark:bg-slate-900/85 px-4 sm:px-6 py-4 sm:py-5 shadow-sm space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-50">
          Objectifs & description de la formation
        </h3>

        {hasShort && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {shortDesc}
          </p>
        )}

        {hasDesc && (
          <div className="text-sm leading-relaxed break-words">
            {/* RichTextBN gère :
                - JSON BlockNote (doc complet ou tableau de blocs)
                - fallback texte brut si ce n’est pas du JSON */}
            <RichTextBN json={description ?? undefined} />
          </div>
        )}
      </div>
    </section>
  );
}
