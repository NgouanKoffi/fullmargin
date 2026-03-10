// ProgramList.tsx
import { FileText, PlayCircle, Image as ImageIcon, Link2 } from "lucide-react";
import type { ModuleT } from "./coursePlayerTypes";
import { cn, minutes } from "./coursePlayerUtils";

type ProgramListProps = {
  modules: ModuleT[];
  canOpenProtected: boolean;
  current: { modIndex: number; lesIndex: number; itemId: string } | null;
  setCurrent: (v: {
    modIndex: number;
    lesIndex: number;
    itemId: string;
  }) => void;
};

export function ProgramList({
  modules,
  canOpenProtected,
  current,
  setCurrent,
}: ProgramListProps) {
  return (
    <div className="rounded-2xl ring-1 ring-slate-200/70 dark:ring-white/10 bg-slate-50/90 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-200/70 dark:border-white/10">
        <div className="font-semibold">Programme du cours</div>
        <div className="text-xs opacity-70">{modules.length} module(s)</div>
      </div>

      <div className="p-2">
        {modules.map((m, mi) => {
          const lessons = m.lessons ?? [];
          return (
            <div key={m.id} className="mb-2 last:mb-0">
              <div className="px-3 py-2 text-sm font-medium opacity-90">
                {m.title || `Module ${mi + 1}`}
              </div>

              {lessons.length === 0 ? (
                <div className="px-3 pb-2 text-xs opacity-60">Aucune leçon</div>
              ) : (
                <ul className="space-y-1 px-2 pb-2">
                  {lessons.map((l, li) => (
                    <li key={l.id}>
                      <div className="px-2 py-1 text-xs opacity-80">
                        {l.title || `Leçon ${li + 1}`}
                      </div>
                      <ul className="space-y-1">
                        {(l.items ?? []).map((it) => {
                          const active =
                            current?.modIndex === mi &&
                            current?.lesIndex === li &&
                            current?.itemId === it.id;

                          const isImage =
                            it.type === "image" || it.subtype === "image";
                          const isLink = it.subtype === "link";

                          const isEmptyPdf =
                            !isImage &&
                            !isLink &&
                            it.type === "pdf" &&
                            (!it.url || it.url.trim() === "");

                          const locked = !canOpenProtected || isEmptyPdf;

                          return (
                            <li key={it.id}>
                              <button
                                type="button"
                                disabled={locked}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (locked) return;
                                  setCurrent({
                                    modIndex: mi,
                                    lesIndex: li,
                                    itemId: it.id,
                                  });
                                }}
                                className={cn(
                                  "w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                                  active
                                    ? "bg-slate-900/10 text-slate-900 dark:bg-white/10 dark:text-white ring-1 ring-slate-300/60 dark:ring-white/20"
                                    : "hover:bg-slate-900/5 dark:hover:bg-white/5",
                                  locked && "opacity-50 cursor-not-allowed"
                                )}
                                title={
                                  locked && isEmptyPdf
                                    ? "Aucun fichier associé à cet item"
                                    : locked
                                    ? "Inscrivez-vous pour accéder au contenu"
                                    : ""
                                }
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
                                <span className="truncate text-sm">
                                  {it.title}
                                  {isEmptyPdf ? " (à ajouter)" : ""}
                                </span>
                                {it.durationMin ? (
                                  <span className="ml-auto text-[11px] opacity-70">
                                    {minutes(it.durationMin)}
                                  </span>
                                ) : null}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
