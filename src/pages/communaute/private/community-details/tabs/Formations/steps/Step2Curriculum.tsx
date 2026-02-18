// src/pages/communaute/private/community-details/tabs/Formations/steps/Step2Curriculum.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type {
  CurriculumItem,
  Lesson,
  Module,
  CurriculumItemType,
} from "../types";
import { Plus } from "lucide-react";

import ModuleCard from "./Step2Curriculum/ModuleCard";
import {
  uid,
  MAX_PREVIEW_BYTES,
  getVideoDurationSeconds,
} from "./Step2Curriculum/helpers";
import type { UIItem } from "./Step2Curriculum/helpers";

type Props = {
  modules: Module[];
  onChange: (modules: Module[]) => void;
};

const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200 Mo

const COMPRESS_LINKS: Array<{ label: string; href: string }> = [
  { label: "HandBrake (PC/Mac) — recommandé", href: "https://handbrake.fr/" },
  {
    label: "Shutter Encoder (PC/Mac)",
    href: "https://www.shutterencoder.com/",
  },
  {
    label: "FreeConvert (en ligne)",
    href: "https://www.freeconvert.com/video-compressor",
  },
  { label: "CloudConvert (en ligne)", href: "https://cloudconvert.com/" },
];

function fmtMo(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} Mo`;
}

export default function Step2Curriculum({ modules, onChange }: Props) {
  const safeModules: Module[] = Array.isArray(modules) ? modules : [];
  const patchModules = (next: Module[]) => onChange(next);

  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set<string>([safeModules[0]?.id].filter(Boolean) as string[])
  );

  const [notice, setNotice] = useState<null | {
    title: string;
    message: string;
    tone?: "info" | "warn" | "error";
    showCompressHelp?: boolean;
  }>(null);

  const openNotice = (n: {
    title: string;
    message: string;
    tone?: "info" | "warn" | "error";
    showCompressHelp?: boolean;
  }) => setNotice(n);

  const portalRoot = useMemo<HTMLElement | null>(() => {
    if (typeof document === "undefined") return null;
    return document.documentElement || document.body;
  }, []);

  useEffect(() => {
    if (!notice) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotice(null);
    };

    window.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [notice]);

  const toggleOpen = (id: string) =>
    setOpenIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const setModule = (mid: string, p: Partial<Module>) =>
    patchModules(safeModules.map((m) => (m.id === mid ? { ...m, ...p } : m)));

  const removeModule = (mid: string) =>
    patchModules(safeModules.filter((m) => m.id !== mid));

  const addModule = () => {
    const id = uid();

    patchModules([
      ...safeModules,
      {
        id,
        title: "Nouveau module",
        description: "",
        lessons: [],
      },
    ]);

    setOpenIds((prev) => {
      const n = new Set(prev);
      n.add(id);
      return n;
    });
  };

  const addLesson = (mid: string) => {
    const m = safeModules.find((x) => x.id === mid);
    const lessons = Array.isArray(m?.lessons) ? m!.lessons : [];

    setModule(mid, {
      lessons: [
        ...lessons,
        {
          id: uid(),
          title: "Nouvelle leçon",
          description: "",
          items: [],
        },
      ],
    });

    setOpenIds((prev) => {
      const n = new Set(prev);
      n.add(mid);
      return n;
    });
  };

  const setLesson = (mid: string, lid: string, p: Partial<Lesson>) => {
    const m = safeModules.find((x) => x.id === mid);
    const lessons = Array.isArray(m?.lessons) ? m!.lessons : [];
    setModule(mid, {
      lessons: lessons.map((l) => (l.id === lid ? { ...l, ...p } : l)),
    });
  };

  const removeLesson = (mid: string, lid: string) => {
    const m = safeModules.find((x) => x.id === mid);
    const lessons = Array.isArray(m?.lessons) ? m!.lessons : [];
    setModule(mid, {
      lessons: lessons.filter((x) => x.id !== lid),
    });
  };

  const setItem = (
    mid: string,
    lid: string,
    iid: string,
    p: Partial<UIItem> & Record<string, unknown>
  ) => {
    const m = safeModules.find((x) => x.id === mid);
    const l = (Array.isArray(m?.lessons) ? m!.lessons : []).find(
      (x) => x.id === lid
    );
    const items = Array.isArray(l?.items) ? (l!.items as UIItem[]) : [];
    const nextItems = items.map((it) =>
      it.id === iid ? { ...(it as UIItem), ...p } : it
    );

    setLesson(mid, lid, {
      items: nextItems as unknown as CurriculumItem[],
    });
  };

  const removeItem = (mid: string, lid: string, iid: string) => {
    const m = safeModules.find((x) => x.id === mid);
    const l = (Array.isArray(m?.lessons) ? m!.lessons : []).find(
      (x) => x.id === lid
    );
    const items = Array.isArray(l?.items) ? (l!.items as UIItem[]) : [];
    setLesson(mid, lid, {
      items: items.filter((it) => it.id !== iid) as unknown as CurriculumItem[],
    });
  };

  const addResource = (mid: string, lid: string) => {
    const m = safeModules.find((x) => x.id === mid);
    const l = (Array.isArray(m?.lessons) ? m!.lessons : []).find(
      (x) => x.id === lid
    );
    const items = Array.isArray(l?.items) ? (l!.items as UIItem[]) : [];
    const next: UIItem[] = [
      ...items,
      {
        id: uid(),
        type: "pdf",
        title: "",
        url: "",
        filename: null,
        file: null,
        __serializedFile: null,
        durationMin: undefined,
        subtype: "doc",
      },
    ];

    setLesson(mid, lid, {
      items: next as unknown as CurriculumItem[],
    });
  };

  const handleLessonItemFile = async (
    mid: string,
    lid: string,
    iid: string,
    baseType: CurriculumItemType,
    file: File | null | undefined
  ) => {
    const patch: Partial<UIItem> = {
      file: file ?? null,
      filename: file?.name ?? null,
    };

    if (!file) {
      patch.__serializedFile = null;
      patch.durationMin = undefined;
      setItem(mid, lid, iid, patch);
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      const isVideo = baseType === "video";
      openNotice({
        tone: "error",
        title: "Fichier trop volumineux",
        message:
          `Taille maximale autorisée : ${fmtMo(MAX_UPLOAD_BYTES)}.\n` +
          `Ton fichier fait : ${fmtMo(file.size)}.\n\n` +
          (isVideo
            ? `Conseil : compresse la vidéo puis réessaie.`
            : `Réduis la taille du fichier puis réessaie.`),
        showCompressHelp: isVideo,
      });

      patch.file = null;
      patch.filename = null;
      patch.__serializedFile = null;
      patch.durationMin = undefined;

      setItem(mid, lid, iid, patch);
      return;
    }

    if (file.size > MAX_PREVIEW_BYTES) {
      console.warn(
        "[Step2Curriculum] Fichier trop lourd pour prévisualisation base64 :",
        file.name,
        file.size
      );

      patch.__serializedFile = null;

      openNotice({
        tone: "warn",
        title: "Prévisualisation désactivée",
        message:
          `Ce fichier est volumineux (≈ ${fmtMo(file.size)}).\n` +
          `Il sera bien envoyé lors de l’enregistrement, mais il ne sera pas prévisualisé dans l’éditeur pour éviter un blocage du navigateur.`,
      });
    } else {
      try {
        const toDataUrl = (f: File) =>
          new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result));
            r.onerror = () => reject(r.error);
            r.readAsDataURL(f);
          });

        const dataUrl = await toDataUrl(file);
        patch.__serializedFile = {
          dataUrl,
          name: file.name,
          type: file.type,
          lastModified: file.lastModified,
        };
      } catch {
        patch.__serializedFile = null;
      }
    }

    if (baseType === "video") {
      try {
        const sec = await getVideoDurationSeconds(file);
        patch.durationMin = Math.max(1, Math.round((Number(sec) || 0) / 60));
      } catch {
        patch.durationMin = undefined;
      }
    } else {
      patch.durationMin = undefined;
    }

    setItem(mid, lid, iid, patch);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start gap-2 sm:gap-3">
        <div>
          <h3 className="font-medium leading-snug text-[15px] sm:text-base">
            Contenu du cours
          </h3>
          <p className="mt-1 text-xs sm:text-[13px] text-slate-500 dark:text-slate-400">
            Organise ton programme en modules et leçons, puis ajoute des
            ressources (vidéos, documents, images, liens…).
          </p>
        </div>
        <button
          onClick={addModule}
          className="justify-self-start sm:justify-self-end inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-violet-600 text-white hover:bg-violet-700"
          title="Ajouter un module"
          type="button"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Ajouter un module</span>
        </button>
      </div>

      <div className="space-y-3">
        {safeModules.map((m, idx) => {
          const lessons: Lesson[] = Array.isArray(m.lessons) ? m.lessons : [];

          return (
            <ModuleCard
              key={m.id}
              module={m}
              index={idx}
              isOpen={openIds.has(m.id)}
              lessons={lessons}
              onToggleOpen={() => toggleOpen(m.id)}
              onChangeModule={(patch) => setModule(m.id, patch)}
              onRemoveModule={() => removeModule(m.id)}
              onAddLesson={() => addLesson(m.id)}
              onChangeLesson={(lid, patch) => setLesson(m.id, lid, patch)}
              onRemoveLesson={(lid) => removeLesson(m.id, lid)}
              getItemsForLesson={(l) =>
                Array.isArray(l.items) ? (l.items as UIItem[]) : []
              }
              onAddResource={(lid) => addResource(m.id, lid)}
              onChangeItem={(lid, iid, patch) => setItem(m.id, lid, iid, patch)}
              onRemoveItem={(lid, iid) => removeItem(m.id, lid, iid)}
              onLessonItemFile={(lid, iid, baseType, f) =>
                handleLessonItemFile(m.id, lid, iid, baseType, f)
              }
            />
          );
        })}

        {safeModules.length === 0 && (
          <div className="text-sm text-slate-500">
            Ajoute ton premier module.
          </div>
        )}
      </div>

      {/* ✅ Popup (PORTAL + z-index MAX) */}
      {notice && portalRoot
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={notice.title}
              className="
                fixed inset-0 isolate
                flex items-stretch justify-stretch p-0
                sm:items-center sm:justify-center sm:p-4
              "
              style={{ zIndex: 2147483647 }}
            >
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/60"
                onClick={() => setNotice(null)}
                aria-hidden="true"
              />

              {/* Card (✅ fullscreen mobile, ✅ hauteur contrainte desktop => scroll OK) */}
              <div
                className="
                  relative w-full
                  h-[100dvh] sm:h-[min(80vh,720px)]
                  sm:max-w-md
                  rounded-none sm:rounded-2xl
                  border border-white/10
                  bg-slate-950 text-slate-100 shadow-2xl
                  overflow-hidden
                "
              >
                {/* ✅ IMPORTANT: min-h-0 pour que overflow-y marche en flex */}
                <div className="flex h-full min-h-0 flex-col">
                  {/* Header (sticky) */}
                  <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 backdrop-blur">
                    <div className="px-4 py-4 sm:px-5 sm:py-4">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-[15px] sm:text-base font-semibold">
                          {notice.title}
                        </h4>

                        <button
                          onClick={() => setNotice(null)}
                          className="shrink-0 rounded-lg px-2 py-1 text-slate-300 hover:bg-white/10 hover:text-white"
                          aria-label="Fermer"
                          type="button"
                          style={{
                            marginTop: "env(safe-area-inset-top, 0px)",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ✅ Content scrollable */}
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-5 sm:px-5">
                    <p className="whitespace-pre-line text-sm text-slate-300">
                      {notice.message}
                    </p>

                    {notice.showCompressHelp && (
                      <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-3 text-red-100">
                        <div className="text-sm font-semibold text-red-200">
                          Où compresser ta vidéo (en gardant la qualité) ?
                        </div>
                        <p className="mt-1 text-xs text-red-200/80">
                          Essaie un de ces outils, puis ré-uploade la vidéo :
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {COMPRESS_LINKS.map((l) => (
                            <a
                              key={l.href}
                              href={l.href}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center rounded-full border border-red-400/20 bg-white/5 px-3 py-1 text-[12px] font-medium text-red-200 hover:bg-white/10"
                            >
                              {l.label}
                              <svg
                                viewBox="0 0 24 24"
                                className="ml-2 h-3.5 w-3.5"
                                fill="none"
                                stroke="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  d="M10 7h7v7"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M17 7 9 15"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M7 9v8a2 2 0 0 0 2 2h8"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </a>
                          ))}
                        </div>

                        <p className="mt-2 text-[11px] leading-4 text-red-200/70">
                          Astuce : si ta vidéo est sensible, utilise plutôt{" "}
                          <b>HandBrake</b> ou <b>Shutter Encoder</b>{" "}
                          (compression en local, sans upload).
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer (sticky bottom) */}
                  <div
                    className="sticky bottom-0 border-t border-white/10 bg-slate-950/95 backdrop-blur px-4 py-4 sm:px-5"
                    style={{
                      paddingBottom:
                        "max(16px, env(safe-area-inset-bottom, 0px))",
                    }}
                  >
                    <div className="flex justify-end">
                      <button
                        onClick={() => setNotice(null)}
                        className="inline-flex items-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                        type="button"
                        autoFocus
                      >
                        OK
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            portalRoot
          )
        : null}
    </div>
  );
}
