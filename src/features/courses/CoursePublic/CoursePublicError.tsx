// src/pages/course/course-public/CoursePublicError.tsx
import { ArrowLeft } from "lucide-react";

type Props = {
  error: string | null;
  onBack: () => void;
};

export function CoursePublicError({ error, onBack }: Props) {
  return (
    <section className="mx-auto w-full max-w-[1400px] 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-10 2xl:px-16 py-6 overflow-x-hidden">
      {/* Bouton tout en haut */}
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-slate-300 dark:ring-slate-600 hover:bg-black/5 dark:hover:bg-white/10"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la page précédente
      </button>

      <div className="rounded-xl ring-1 ring-rose-300 dark:ring-rose-700/60 bg-rose-50 dark:bg-rose-900/20 p-6 text-rose-700 dark:text-rose-300">
        {error || "Cours introuvable"}
      </div>
    </section>
  );
}
