// src/pages/communaute/private/community-details/tabs/Formations/CoursePlayer/LessonsColumn.tsx
import { useEffect, useState } from "react";
import {
  Clock,
  FileText,
  PlayCircle,
  Image as ImageIcon,
  Link2,
} from "lucide-react";

import type { ModuleT, CurriculumItem } from "./coursePlayerTypes";
import { RichTextBN } from "./RichTextBN";
import { ResourceViewer } from "./ResourceViewer";
import { minutes } from "./coursePlayerUtils";

/* ============ Helpers progression locale (localStorage) ============ */

const PROGRESS_KEY = "fm_course_progress";

type ProgressStore = {
  [courseId: string]: {
    [itemId: string]: true;
  };
};

function loadProgress(courseId: string): Set<string> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as ProgressStore;
    const ids = parsed?.[courseId] || {};
    return new Set(Object.keys(ids));
  } catch {
    return new Set();
  }
}

function saveVisited(courseId: string, itemId: string) {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const parsed: ProgressStore = raw ? JSON.parse(raw) : {};
    if (!parsed[courseId]) parsed[courseId] = {};
    parsed[courseId][itemId] = true;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(parsed));
  } catch {
    // silencieux
  }
}

/* ============ Colonne leçons + ressources ============ */

type LessonsColumnProps = {
  courseId: string;
  module: ModuleT | null;
  onOpenFullscreen: (item: CurriculumItem) => void;
};

export function LessonsColumn({
  courseId,
  module,
  onOpenFullscreen,
}: LessonsColumnProps) {
  const [openLessonIndex, setOpenLessonIndex] = useState<number | null>(null);
  const [openResourceId, setOpenResourceId] = useState<string | null>(null);
  const [visited, setVisited] = useState<Set<string>>(() =>
    courseId ? loadProgress(courseId) : new Set()
  );

  // changement de module → ouvrir la 1ʳᵉ leçon + la 1ʳᵉ ressource automatiquement
  useEffect(() => {
    if (!module || !module.lessons?.length) {
      setOpenLessonIndex(null);
      setOpenResourceId(null);
      return;
    }

    const firstLesson = module.lessons[0];
    const firstItem = firstLesson?.items?.[0];

    setOpenLessonIndex(0);

    if (firstItem?.id) {
      setOpenResourceId(firstItem.id);
      saveVisited(courseId, firstItem.id);
      setVisited((old) => new Set(old).add(firstItem.id));
    } else {
      setOpenResourceId(null);
    }
  }, [courseId, module]);

  // recharger la progression si le courseId change
  useEffect(() => {
    setVisited(loadProgress(courseId));
  }, [courseId]);

  if (!module) {
    return (
      <div className="rounded-2xl ring-1 ring-slate-200/80 dark:ring-white/10 bg-white/90 dark:bg-slate-950/70 p-4 text-sm text-slate-500 dark:text-slate-400">
        Sélectionne un module pour voir ses leçons et ressources.
      </div>
    );
  }

  const lessons = module.lessons ?? [];

  if (lessons.length === 0) {
    return (
      <div className="rounded-2xl ring-1 ring-slate-200/80 dark:ring-white/10 bg-white/90 dark:bg-slate-950/70 p-4 text-sm text-slate-500 dark:text-slate-400">
        Aucun contenu n’a encore été ajouté à ce module.
      </div>
    );
  }

  const handleOpenResource = (itemId: string) => {
    setOpenResourceId((prev) => {
      const next = prev === itemId ? null : itemId;
      if (next) {
        saveVisited(courseId, next);
        setVisited((old) => new Set(old).add(next));
      }
      return next;
    });
  };

  return (
    <div className="rounded-2xl ring-1 ring-slate-200/80 dark:ring-white/10 bg-white/90 dark:bg-slate-950/70 p-4 space-y-3">
      {lessons.map((l, li) => {
        const isOpen = openLessonIndex === li;
        const items = l.items ?? [];
        const hasDesc = !!l.description?.trim();

        return (
          <div
            key={l.id}
            className={`rounded-xl border ${
              isOpen
                ? "border-slate-400 bg-slate-50 dark:border-slate-500 dark:bg-slate-900"
                : "border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60"
            }`}
          >
            {/* Header leçon */}
            <button
              type="button"
              onClick={() => {
                if (isOpen) {
                  // on referme la leçon & le viewer
                  setOpenLessonIndex(null);
                  setOpenResourceId(null);
                } else {
                  // on ouvre cette leçon + 1ʳᵉ ressource directement
                  setOpenLessonIndex(li);
                  const firstItem = items[0];
                  if (firstItem?.id) {
                    setOpenResourceId(firstItem.id);
                    saveVisited(courseId, firstItem.id);
                    setVisited((old) => new Set(old).add(firstItem.id));
                  } else {
                    setOpenResourceId(null);
                  }
                }
              }}
              className="w-full px-3 py-2 flex items-center gap-2 text-left"
            >
              <div className="flex-1">
                <div className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">
                  {l.title || `Leçon ${li + 1}`}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {items.length} ressource{items.length > 1 ? "s" : ""}
                </div>
              </div>
              <svg
                className={`h-4 w-4 shrink-0 transition-transform ${
                  isOpen ? "rotate-180" : "rotate-0"
                }`}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M6 9l6 6 6-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Contenu leçon : description + ressources */}
            {isOpen && (
              <div className="px-3 pb-3 space-y-3 border-t border-slate-100/80 dark:border-slate-800/80 pt-2">
                {hasDesc && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                      À propos de cette leçon
                    </div>
                    <RichTextBN json={l.description} />
                  </div>
                )}

                {items.length === 0 ? (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Aucune ressource n’a encore été ajoutée.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((it) => {
                      const isImage =
                        it.type === "image" || it.subtype === "image";
                      const isLink = it.subtype === "link";
                      const isOpenItem = openResourceId === it.id;
                      const alreadyVisited = visited.has(it.id);

                      return (
                        <div
                          key={it.id}
                          className="rounded-lg bg-slate-900/5 dark:bg-slate-900/80 p-3"
                        >
                          {/* Titre ressource (clic pour changer de viewer) */}
                          <button
                            type="button"
                            onClick={() => handleOpenResource(it.id)}
                            className="w-full flex items-center gap-2 text-sm text-slate-900 dark:text-slate-50"
                          >
                            {it.type === "video" ? (
                              <PlayCircle className="h-4 w-4 shrink-0" />
                            ) : isImage ? (
                              <ImageIcon className="h-4 w-4 shrink-0" />
                            ) : isLink ? (
                              <Link2 className="h-4 w-4 shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 shrink-0" />
                            )}
                            <span className="font-medium truncate">
                              {it.title}
                            </span>
                            {alreadyVisited && (
                              <span className="ml-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] px-2 py-0.5">
                                Vu
                              </span>
                            )}
                            {it.durationMin ? (
                              <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-300">
                                <Clock className="h-3.5 w-3.5" />
                                {minutes(it.durationMin)}
                              </span>
                            ) : null}
                          </button>

                          {/* Viewer de cette ressource (visible directement pour la ressource sélectionnée) */}
                          {isOpenItem && (
                            <ResourceViewer
                              courseId={courseId}
                              item={it}
                              onRequestFullscreen={() => onOpenFullscreen(it)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
