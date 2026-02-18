// src/pages/communaute/public/courses/components/Curriculum.tsx
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Lock, PlayCircle } from "lucide-react";
import type { CourseSaved } from "./CourseTypes";

// ⬇️ types importés depuis la définition partagée

type ModuleT = NonNullable<CourseSaved["modules"]>[number];
type LessonT = NonNullable<ModuleT["lessons"]>[number];

function Accordion({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl ring-1 ring-slate-200/70 dark:ring-slate-700/60 bg-white/70 dark:bg-slate-900/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/5 dark:hover:bg-white/10"
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
        <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
          {title}
        </span>
        {badge ? (
          <span className="ml-auto text-xs rounded-full px-2 py-0.5 ring-1 ring-slate-300 dark:ring-slate-600">
            {badge}
          </span>
        ) : null}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function Curriculum({
  course,
  modules,
  enrolled,
  playerHref,
}: {
  course: CourseSaved;
  modules: ModuleT[];
  enrolled: boolean;
  /** URL absolue vers le player (calculée par CoursePublic) */
  playerHref: string;
}) {
  const modulesCount = modules.length;

  // 🔒 Accès au player UNIQUEMENT si on est inscrit
  const canOpen = enrolled;

  if (modulesCount === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-3">
      <h2 className="text-base font-semibold">Programme du cours</h2>
      <div className="space-y-3">
        {modules.map((m, mi) => {
          const lessons = m.lessons ?? [];
          const badge = `${lessons.length} leçon${
            lessons.length > 1 ? "s" : ""
          }`;

          return (
            <Accordion key={m.id} title={`${mi + 1}. ${m.title}`} badge={badge}>
              <ul className="space-y-2">
                {lessons.map((l: LessonT, li: number) => {
                  const content = (
                    <>
                      {canOpen ? (
                        <PlayCircle className="h-4 w-4 text-slate-400 shrink-0" />
                      ) : (
                        <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">
                        {mi + 1}.{li + 1} {l.title}
                      </span>
                    </>
                  );

                  // ✅ Si accès autorisé ➜ véritable <Link> vers le player
                  if (canOpen) {
                    return (
                      <li key={l.id}>
                        <Link
                          to={playerHref}
                          className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                          title="Ouvrir le lecteur"
                        >
                          {content}
                        </Link>
                      </li>
                    );
                  }

                  // ❌ Sinon élément totalement non cliquable
                  return (
                    <li
                      key={l.id}
                      className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-not-allowed opacity-70"
                      title="Inscrivez-vous pour accéder au contenu"
                      aria-disabled={true}
                    >
                      {content}
                    </li>
                  );
                })}

                {lessons.length === 0 && (
                  <li className="text-xs text-slate-500">
                    (Aucune leçon listée)
                  </li>
                )}
              </ul>
            </Accordion>
          );
        })}
      </div>

      {/* Bandeau info : seulement si payant */}
      {course.priceType === "paid" && (
        <div className="rounded-xl ring-1 ring-slate-200/70 dark:ring-slate-700/60 p-3 text-xs text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/50 flex items-start gap-2">
          <Lock className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="break-words">
            Le contenu détaillé (vidéos, PDFs) est protégé.{" "}
            {enrolled ? (
              <Link
                to={playerHref}
                className="underline underline-offset-2 hover:no-underline text-violet-600"
              >
                Accéder aux leçons
              </Link>
            ) : (
              "Inscrivez-vous pour y accéder."
            )}
          </span>
        </div>
      )}
    </div>
  );
}
