// src/pages/communaute/private/community-details/tabs/Formations/steps/Step2Curriculum/ModuleCard.tsx
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import type { Lesson, Module, CurriculumItemType } from "../../types"; // ⬅️ ajoute CurriculumItemType
import type { UIItem } from "./helpers";
import LessonCard from "./LessonCard";
import { RichTextDescriptionEditor } from "../../../../../../../../components/blocknote/RichTextDescription";

type ModuleCardProps = {
  module: Module;
  index: number;
  isOpen: boolean;
  lessons: Lesson[];
  onToggleOpen: () => void;
  onChangeModule: (patch: Partial<Module>) => void;
  onRemoveModule: () => void;
  onAddLesson: () => void;
  onChangeLesson: (lessonId: string, patch: Partial<Lesson>) => void;
  onRemoveLesson: (lessonId: string) => void;
  getItemsForLesson: (lesson: Lesson) => UIItem[];
  onAddResource: (lessonId: string) => void;
  onChangeItem: (
    lessonId: string,
    itemId: string,
    patch: Partial<UIItem> & Record<string, unknown>
  ) => void;
  onRemoveItem: (lessonId: string, itemId: string) => void;
  onLessonItemFile: (
    lessonId: string,
    itemId: string,
    baseType: CurriculumItemType, // ⬅️ au lieu de "video" | "pdf"
    file: File | null | undefined
  ) => void;
};

export default function ModuleCard({
  module,
  index,
  isOpen,
  lessons,
  onToggleOpen,
  onChangeModule,
  onRemoveModule,
  onAddLesson,
  onChangeLesson,
  onRemoveLesson,
  getItemsForLesson,
  onAddResource,
  onChangeItem,
  onRemoveItem,
  onLessonItemFile,
}: ModuleCardProps) {
  const altBg =
    index % 2 === 0
      ? "bg-slate-900/5 dark:bg-slate-800/40"
      : "bg-slate-900/0 dark:bg-slate-800/20";

  return (
    <div
      className={`rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 ${altBg}`}
    >
      {/* HEADER MODULE */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start gap-2 sm:gap-3 p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleOpen}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-slate-300 dark:ring-slate-600 hover:bg-black/5 dark:hover:bg-white/10"
              title={isOpen ? "Replier" : "Déplier"}
              aria-label={isOpen ? "Replier" : "Déplier"}
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            <input
              className="w-full rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 outline-none"
              value={module.title}
              onChange={(e) => onChangeModule({ title: e.target.value })}
              placeholder="Nom du module"
            />
          </div>

          {/* Description module en BlockNote (optionnel) */}
          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-600 dark:text-slate-300">
              Description du module (optionnel)
            </label>
            <RichTextDescriptionEditor
              value={module.description || ""}
              onChange={(val) => onChangeModule({ description: val })}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-self-start sm:justify-self-end">
          <button
            onClick={onAddLesson}
            className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm ring-1 ring-slate-300 dark:ring-slate-600 hover:bg-black/5 dark:hover:bg-white/10"
            title="Ajouter une leçon"
            aria-label="Ajouter une leçon"
          >
            <Plus className="h-4 w-4 mr-1" />
            Leçon
          </button>
          <button
            onClick={onRemoveModule}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-rose-300 text-rose-600 dark:ring-rose-700 hover:bg-rose-500/10"
            title="Supprimer le module"
            aria-label="Supprimer le module"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          {lessons.map((l) => {
            const items = getItemsForLesson(l);

            return (
              <LessonCard
                key={l.id}
                moduleId={module.id}
                lesson={l}
                items={items}
                onChangeLesson={(patch) => onChangeLesson(l.id, patch)}
                onRemoveLesson={() => onRemoveLesson(l.id)}
                onAddResource={() => onAddResource(l.id)}
                onChangeItem={(itemId, patch) =>
                  onChangeItem(l.id, itemId, patch)
                }
                onRemoveItem={(itemId) => onRemoveItem(l.id, itemId)}
                onLessonItemFile={(itemId, baseType, file) =>
                  onLessonItemFile(l.id, itemId, baseType, file)
                }
              />
            );
          })}

          {lessons.length === 0 && (
            <div className="text-xs text-slate-500">
              Ce module n’a pas encore de leçon. Ajoute au moins une leçon.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
