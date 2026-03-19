// src/pages/communaute/private/community-details/tabs/Formations/steps/Step2Curriculum/LessonCard.tsx
import { Plus, Trash2 } from "lucide-react";
import { Reorder } from "framer-motion";
import type { Lesson, CurriculumItemType } from "../../types";
import type { UIItem } from "./helpers";
import ResourceCard from "./ResourceCard";
import { RichTextDescriptionEditor } from "@shared/components/blocknote/RichTextDescription";

type LessonCardProps = {
  moduleId: string;
  lesson: Lesson;
  items: UIItem[];
  onChangeLesson: (patch: Partial<Lesson>) => void;
  onRemoveLesson: () => void;
  onAddResource: () => void;
  onChangeItem: (
    itemId: string,
    patch: Partial<UIItem> & Record<string, unknown>
  ) => void;
  onRemoveItem: (itemId: string) => void;
  onLessonItemFile: (
    itemId: string,
    baseType: CurriculumItemType,
    file: File | null | undefined
  ) => void;
  onMoveItem: (fromIdx: number, toIdx: number) => void;
  onReorderItems: (items: UIItem[]) => void;
};

export default function LessonCard({
  lesson,
  items,
  onChangeLesson,
  onRemoveLesson,
  onAddResource,
  onChangeItem,
  onRemoveItem,
  onLessonItemFile,
  onMoveItem,
  onReorderItems,
}: LessonCardProps) {
  return (
    <div className="rounded-xl p-3 ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-50/70 dark:bg-slate-800/60">
      {/* HEADER LEÇON */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start gap-2 sm:gap-3">
        <div className="space-y-2">
          <input
            className="w-full rounded-xl px-3 py-2 bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 outline-none text-sm"
            value={lesson.title}
            onChange={(e) => onChangeLesson({ title: e.target.value })}
            placeholder="Nom de la leçon / chapitre"
          />

          {/* Description en BlockNote (même logique que Step1) */}
          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-600 dark:text-slate-300">
              Description de la leçon (optionnel)
            </label>
            <RichTextDescriptionEditor
              value={lesson.description || ""}
              onChange={(val) => onChangeLesson({ description: val })}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-self-start sm:justify-self-end">
          {/* Bouton principal +Ressource (en haut) */}
          <button
            onClick={onAddResource}
            className="inline-flex items-center justify-center rounded-lg px-3 h-9 text-sm ring-1 ring-slate-300 dark:ring-slate-600 hover:bg-black/5 dark:hover:bg-white/10"
            type="button"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ressource
          </button>
          <button
            onClick={onRemoveLesson}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-rose-300 text-rose-600 dark:ring-rose-700 hover:bg-rose-500/10"
            title="Supprimer la leçon"
            aria-label="Supprimer la leçon"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* RESSOURCES DE LA LEÇON */}
      <div className="mt-3 space-y-2">
        {items.length === 0 && (
          <div className="text-xs text-slate-500">
            Ajoute au moins une ressource pour cette leçon.
          </div>
        )}

        {items.length > 0 && (
          <Reorder.Group
            axis="y"
            values={items}
            onReorder={onReorderItems}
            className="space-y-3"
          >
            {items.map((it, idx) => (
              <Reorder.Item
                key={it.id}
                value={it}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ResourceCard
                  item={it}
                  index={idx}
                  totalItems={items.length}
                  onChangeItem={(patch) => onChangeItem(it.id, patch)}
                  onRemove={() => onRemoveItem(it.id)}
                  onMoveItem={(toIdx) => onMoveItem(idx, toIdx)}
                  onFileChange={(baseType, file) =>
                    onLessonItemFile(it.id, baseType, file)
                  }
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      {/* ⚡ Bouton dupliqué en BAS pour ne pas remonter la page */}
      <div className="mt-4 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-end">
        <button
          onClick={onAddResource}
          className="inline-flex items-center justify-center rounded-lg px-3 h-9 text-sm ring-1 ring-slate-300 dark:ring-slate-600 hover:bg-black/5 dark:hover:bg-white/10"
          type="button"
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter une ressource
        </button>
      </div>
    </div>
  );
}
