import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Layers, CalendarClock } from "lucide-react";
import { ModuleSidebar } from "@features/courses/CoursePlayer/ModuleSidebar";
import { LessonsColumn } from "@features/courses/CoursePlayer/LessonsColumn";
import { RichTextBN } from "@features/courses/CoursePlayer/RichTextBN";
import type { CourseDraft } from "./types";
import type { ModuleT, CurriculumItem } from "@features/courses/CoursePlayer/coursePlayerTypes";

type FormationsPreviewProps = {
  draft: CourseDraft;
  onClose: () => void;
};

export default function FormationsPreview({ draft, onClose }: FormationsPreviewProps) {
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);

  // Mapping simple pour que les types de l'admin matchent ceux du player
  const modules = useMemo<ModuleT[]>(() => {
    return (draft.modules || []).map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      lessons: (m.lessons || []).map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        items: (l.items || []).map((it) => ({
          ...it,
          type: it.type as any,
          subtype: it.subtype as any,
        })) as CurriculumItem[],
      })),
    }));
  }, [draft.modules]);

  const selectedModule = modules[selectedModuleIndex] || null;

  const lessonsCount = useMemo(
    () => modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0),
    [modules]
  );

  const content = (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Header Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 rounded bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm shadow-amber-500/20">
            Prévisualisation
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate max-w-[200px] sm:max-w-md">
              {draft.title || "Nouvelle formation"}
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Rendu en temps réel • Modifications non sauvegardées
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="group p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
          title="Fermer la prévisualisation"
        >
          <X className="h-6 w-6 group-hover:scale-110" />
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50 p-4 sm:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Mock Player Header */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3 flex-1">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                  {draft.title || "Titre de votre formation"}
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                  {draft.shortDesc || "Votre description courte apparaîtra ici..."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 bg-slate-900 text-white dark:bg-slate-800 text-xs font-semibold shadow-lg shadow-slate-900/10">
                  <Layers className="h-3.5 w-3.5" />
                  {modules.length} modules • {lessonsCount} leçons
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Mise à jour (maintenant)
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 bg-violet-600 text-white text-xs font-semibold">
                  {draft.level}
                </span>
              </div>
            </div>
          </div>

          {/* Player Mockup Grid */}
          <div className="grid gap-8 lg:grid-cols-[minmax(280px,340px),1fr]">
            {/* Sidebar */}
            <aside className="space-y-4">
              <ModuleSidebar
                modules={modules}
                selectedModuleIndex={selectedModuleIndex}
                onSelectModule={(idx) => setSelectedModuleIndex(idx)}
                onShowReviews={() => alert("Les avis ne sont pas disponibles en prévisualisation.")}
              />
            </aside>

            {/* Content Column */}
            <div className="space-y-4">
              {selectedModule && (
                <div className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-violet-500 mb-1">
                    Module Actuel
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                    {selectedModule.title || `Module ${selectedModuleIndex + 1}`}
                  </h2>
                  {selectedModule.description && (
                    <div className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      <RichTextBN json={selectedModule.description} />
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-1">
                <LessonsColumn
                  courseId="preview-mode"
                  module={selectedModule}
                  onOpenFullscreen={() => alert("Le plein écran est désactivé en prévisualisation.")}
                />
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-center gap-3 text-amber-800 dark:text-amber-200 text-xs italic">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                Mode prévisualisation : Certains liens et fonctionnalités de suivi de progression sont désactivés.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
