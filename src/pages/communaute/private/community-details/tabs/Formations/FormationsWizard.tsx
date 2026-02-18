// src/pages/communaute/public/community-details/tabs/Formations/FormationsWizard.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import ProgressSteps from "./composants/ProgressSteps";
import BottomBar from "./composants/BottomBar";

/* Étapes */
import Step1Infos from "./steps/Step1Infos";
import Step2Curriculum from "./steps/Step2Curriculum";
import Step3Tarif from "./steps/Step3Tarifs";

/* Types */
import type { CourseDraft, Module, Level } from "./types";
import type { CourseSaved } from "./formations.api";
import type { CI } from "./formations.media";
import type { Step } from "./formations.validation";

/* runtime */
import { createCourseMultipart, updateCourseMultipart } from "./formations.api";
import {
  reviveFile,
  serializeFile,
  mergeModulesPreserveMedia,
} from "./formations.media";
import { validateAll } from "./formations.validation";

const STORAGE_KEY_DRAFT = "fm:course-draft";
type DraftMeta = { id?: string; createdAt?: string };
export type { CourseSaved };

/* ✅ Ici on accepte aussi les images et on garde subtype */
type SerializedUIItem = {
  id: string;
  type: "video" | "pdf" | "image";
  title: string;
  durationMin?: number;
  url: string | null;
  filename: string | null;
  __serializedFile: import("./formations.media").SerializedFile | null;
  subtype?: "video" | "doc" | "link" | "image" | string | null;
};

type PersistedLesson = {
  id: string;
  title: string;
  description: string;
  items: SerializedUIItem[];
};

type PersistedModule = {
  id: string;
  title: string;
  description: string;
  lessons: PersistedLesson[];
};

type PersistedDraftForStorage = Omit<CourseDraft, "coverFile" | "modules"> & {
  __coverFileSerialized: import("./formations.media").SerializedFile | null;
  modules: PersistedModule[];
};

const allowedLevels: Level[] = [
  "Débutant",
  "Intermédiaire",
  "Avancé",
  "Tous niveaux",
];
const ensureLevel = (v: string): Level =>
  (allowedLevels as string[]).includes(v) ? (v as Level) : "Tous niveaux";

export default function FormationsWizardInner({
  communityId,
  initialDraft,
  editingMeta,
  onCancel,
  onSaved,
}: {
  communityId: string;
  initialDraft: CourseDraft | null;
  editingMeta?: DraftMeta;
  onCancel: () => void;
  onSaved: (saved: CourseSaved) => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const lastSavedRef = useRef<string | null>(null);
  const noticeRef = useRef<HTMLDivElement | null>(null);

  /* ✅ Progress UI (visuelle) pendant submit */
  const [submitProgress, setSubmitProgress] = useState<number | null>(null);
  const [submitStage, setSubmitStage] = useState<string | null>(null);
  const progIntervalRef = useRef<number | null>(null);
  const progKickRef = useRef<number | null>(null);

  const stopProgress = () => {
    if (progIntervalRef.current) window.clearInterval(progIntervalRef.current);
    if (progKickRef.current) window.clearTimeout(progKickRef.current);
    progIntervalRef.current = null;
    progKickRef.current = null;
  };

  const beginProgress = () => {
    stopProgress();
    setSubmitProgress(0);
    setSubmitStage("Préparation des fichiers…");

    let p = 0;

    // petit délai => rendu UX plus naturel
    progKickRef.current = window.setTimeout(() => {
      setSubmitStage("Envoi des fichiers…");
      progIntervalRef.current = window.setInterval(() => {
        // on monte doucement jusqu'à ~88% (le reste = finalisation)
        const inc = Math.random() < 0.75 ? 2 : 1;
        p = Math.min(88, p + inc);
        setSubmitProgress(p);
      }, 180);
    }, 450);
  };

  useEffect(() => {
    // cleanup unmount
    return () => stopProgress();
  }, []);

  const [draft, setDraft] = useState<CourseDraft>(() => ({
    title: "",
    level: "Tous niveaux",
    coverFile: null,
    coverPreview: null,
    learnings: [],
    shortDesc: "",
    longDesc: "",
    modules: [],
    priceType: "free",
    currency: "USD",
    price: undefined,
    visibility: "public",
  }));

  useEffect(() => {
    if (initialDraft) setDraft(initialDraft);
  }, [initialDraft]);

  /* hydrate from LS */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (initialDraft) {
          setHydrated(true);
          return;
        }
        const raw = localStorage.getItem(STORAGE_KEY_DRAFT);
        if (!raw) {
          setHydrated(true);
          return;
        }

        const saved = JSON.parse(raw) as PersistedDraftForStorage;
        const revivedCover = reviveFile(saved.__coverFileSerialized ?? null);
        const coverPreview = revivedCover
          ? URL.createObjectURL(revivedCover)
          : null;

        const revivedModules: Module[] = (saved.modules ?? []).map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          lessons: (m.lessons ?? []).map((l) => ({
            id: l.id,
            title: l.title,
            description: l.description,
            items: l.items.map((it) => ({
              id: it.id,
              type: it.type,
              title: it.title,
              url: it.url ?? "",
              filename: it.filename,
              file: reviveFile(it.__serializedFile ?? null),
              __serializedFile: it.__serializedFile,
              durationMin: it.durationMin,
              subtype:
                it.subtype ??
                (it.type === "image" ? "image" : ("doc" as const)),
            })) as unknown as import("./types").CurriculumItem[],
          })),
        }));

        if (!cancelled) {
          setDraft((d) => ({
            ...d,
            title: saved.title,
            level: ensureLevel(saved.level as unknown as string),
            coverFile: revivedCover,
            coverPreview,
            learnings: saved.learnings,
            shortDesc: saved.shortDesc,
            longDesc: saved.longDesc,
            modules: revivedModules,
            priceType: saved.priceType,
            currency: saved.currency || "USD",
            price: saved.price,
            visibility: saved.visibility ?? "public",
          }));
          setHydrated(true);
        }
      } catch {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialDraft]);

  /* persist to LS */
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const persisted: PersistedDraftForStorage = {
          title: draft.title,
          level: draft.level,
          coverPreview: draft.coverPreview,
          learnings: draft.learnings,
          shortDesc: draft.shortDesc,
          longDesc: draft.longDesc,
          modules: await Promise.all(
            draft.modules.map(async (m) => ({
              id: m.id,
              title: m.title,
              description: m.description || "",
              lessons: await Promise.all(
                (m.lessons ?? []).map(async (l) => ({
                  id: l.id,
                  title: l.title,
                  description: l.description || "",
                  items: await Promise.all(
                    (l.items as unknown as CI[]).map(async (it) => ({
                      id: it.id,
                      type: it.type,
                      title: it.title,
                      durationMin: it.durationMin,
                      url: it.url ?? null,
                      filename: it.filename ?? null,
                      __serializedFile: it.file
                        ? await serializeFile(it.file)
                        : it.__serializedFile ?? null,
                      subtype:
                        it.subtype ??
                        (it.type === "image" ? "image" : ("doc" as const)),
                    }))
                  ),
                }))
              ),
            }))
          ),
          priceType: draft.priceType,
          currency: draft.currency || "USD",
          price: draft.price,
          visibility: draft.visibility ?? "public",
          __coverFileSerialized: draft.coverFile
            ? await serializeFile(draft.coverFile)
            : null,
        };
        const json = JSON.stringify(persisted);
        if (!cancelled && json !== lastSavedRef.current) {
          localStorage.setItem(STORAGE_KEY_DRAFT, json);
          lastSavedRef.current = json;
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draft, hydrated]);

  /* scroll notice */
  useEffect(() => {
    if (!notice) return;
    if (noticeRef.current) {
      noticeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [notice]);

  const patch = (p: Partial<CourseDraft>) => setDraft((d) => ({ ...d, ...p }));

  const validation = useMemo(() => validateAll(draft), [draft]);
  const byStep = validation.byStep;

  const maxStepAllowed: Step = useMemo(() => {
    if (!byStep[1].ok) return 1;
    if (!byStep[2].ok) return 2;
    if (!byStep[3].ok) return 3;
    return 3;
  }, [byStep]);

  const currentValid = byStep[step].ok;
  const allValid = byStep[1].ok && byStep[2].ok && byStep[3].ok;

  const stepName = (s: Step) =>
    ({
      1: "Infos & objectifs",
      2: "Programme",
      3: "Tarif",
    }[s]);

  const buildErrorText = (s: Step) => {
    const msgs = byStep[s].messages;
    return msgs.length === 0
      ? `Complète les champs requis de l’étape “${stepName(s)}”.`
      : `Étape “${stepName(s)}” :\n- ${msgs.join("\n- ")}`;
  };

  const goPrev = () => {
    if (saving) return;
    setStep((s) => {
      if (s === 1) return 1;
      return (s - 1) as Step;
    });
  };

  const goNext = () => {
    if (saving) return;
    if (!currentValid) {
      setNotice(buildErrorText(step));
      return;
    }
    setNotice(null);
    setStep((s) => {
      if (s === 3) return 3;
      return (s + 1) as Step;
    });
  };

  const submitFormation = async () => {
    if (saving) return;

    // ⚠️ Création : on garde la validation complète
    if (!editingMeta?.id) {
      const vAll = validateAll(draft);
      if (!vAll.ok) {
        const firstInvalid = (
          Object.keys(vAll.byStep) as unknown as Step[]
        ).find((k) => !vAll.byStep[k].ok) as Step;
        setStep(firstInvalid);
        setNotice(buildErrorText(firstInvalid));
        return;
      }
    } else {
      // ✏️ Édition : on vérifie juste le prix (pour que tu puisses descendre à 0.05)
      if (draft.priceType === "paid") {
        const p =
          typeof draft.price === "number" && Number.isFinite(draft.price)
            ? draft.price
            : 0;
        if (p < 0.05) {
          setStep(3);
          setNotice(
            "Le prix de la formation est trop bas. Le minimum accepté pour les tests est de 0,05 $."
          );
          return;
        }
      }
    }

    try {
      setNotice(null);
      setSaving(true);

      // ✅ démarre une progression visuelle (rassure l'utilisateur)
      beginProgress();

      if (!editingMeta?.id) {
        if (!draft.coverFile && !draft.coverPreview) {
          setNotice("Ajoute une photo de couverture.");
          setSaving(false);
          stopProgress();
          setSubmitProgress(null);
          setSubmitStage(null);
          return;
        }

        const created = await createCourseMultipart(communityId, draft);

        // ✅ finalisation
        stopProgress();
        setSubmitStage("Finalisation…");
        setSubmitProgress(96);
        await new Promise((r) => setTimeout(r, 250));
        setSubmitProgress(100);
        await new Promise((r) => setTimeout(r, 350));

        localStorage.removeItem(STORAGE_KEY_DRAFT);
        onSaved(created);
      } else {
        const updated = await updateCourseMultipart(editingMeta.id, draft);

        // ✅ finalisation
        stopProgress();
        setSubmitStage("Finalisation…");
        setSubmitProgress(96);
        await new Promise((r) => setTimeout(r, 250));
        setSubmitProgress(100);
        await new Promise((r) => setTimeout(r, 350));

        localStorage.removeItem(STORAGE_KEY_DRAFT);
        onSaved(updated);
      }
    } catch (e) {
      stopProgress();
      setSubmitStage("Échec de l’envoi.");
      setSubmitProgress(100);

      const msg = e instanceof Error ? e.message : "Échec de la sauvegarde.";
      setNotice(msg);

      // on laisse 600ms pour que l'utilisateur voie l'état, puis on masque
      await new Promise((r) => setTimeout(r, 600));
    } finally {
      setSaving(false);
      setSubmitProgress(null);
      setSubmitStage(null);
    }
  };

  const percent =
    typeof submitProgress === "number" && Number.isFinite(submitProgress)
      ? Math.max(0, Math.min(100, Math.round(submitProgress)))
      : null;

  return (
    <section
      className={[
        "mx-auto w-full max-w-[1380px] px-3 sm:px-6 lg:px-10 space-y-5",
        saving ? "pb-24" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {editingMeta?.id ? "Modifier la formation" : "Éditeur de formation"}
        </h2>
        <button
          onClick={onCancel}
          className="inline-flex items-center justify-center p-2 rounded-lg ring-1 ring-slate-300 hover:bg-black/5 disabled:opacity-50 dark:ring-slate-600 dark:hover:bg-white/10"
          title="Retour"
          aria-label="Retour"
          disabled={saving}
        >
          <ArrowLeft className="h-4 w-4" />
          &nbsp; Retour
        </button>
      </div>

      <ProgressSteps
        step={step}
        total={3}
        onJump={(n) => {
          if (saving) return;
          const target = n as Step;
          if (target <= maxStepAllowed) {
            setStep(target);
            setNotice(null);
          } else {
            setNotice(buildErrorText(maxStepAllowed));
          }
        }}
        className="mb-2"
        maxStepAllowed={maxStepAllowed}
      />

      <div className={step === 1 ? "block" : "hidden"}>
        <Step1Infos data={draft} onChange={patch} />
      </div>

      <div className={step === 2 ? "block" : "hidden"}>
        <Step2Curriculum
          modules={draft.modules}
          onChange={(mods) =>
            setDraft((d) => ({
              ...d,
              modules: mergeModulesPreserveMedia(d.modules, mods),
            }))
          }
        />
      </div>

      <div className={step === 3 ? "block" : "hidden"}>
        <Step3Tarif
          data={draft}
          onChange={patch}
          onSubmit={submitFormation}
          canSubmit={allValid}
          isEdit={Boolean(editingMeta?.id)}
          isSubmitting={saving}
          submitProgress={submitProgress}
          submitStage={submitStage}
        />
      </div>

      {notice && (
        <div
          ref={noticeRef}
          className="mt-3 rounded-xl border border-amber-300/60 bg-amber-50/70 text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-200 p-3 whitespace-pre-line"
        >
          {notice}
        </div>
      )}

      {/* ✅ Empêche navigation pendant upload */}
      {!saving && <BottomBar onPrev={goPrev} onNext={goNext} />}

      {/* ✅ Barre de progression FIXE en bas */}
      {saving && (
        <div
          className="fixed left-0 right-0 bottom-0 z-[9999]"
          style={{
            paddingBottom: "max(10px, env(safe-area-inset-bottom, 0px))",
          }}
          aria-live="polite"
        >
          <div className="mx-auto w-full max-w-[1380px] px-3 sm:px-6 lg:px-10">
            <div className="rounded-t-2xl border border-white/10 bg-slate-950/90 backdrop-blur shadow-2xl">
              <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 ring-1 ring-violet-500/25">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </span>
                      <span className="truncate">
                        {editingMeta?.id
                          ? "Mise à jour en cours…"
                          : "Création en cours…"}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-300">
                      {submitStage ?? "Envoi des fichiers…"}
                    </div>
                  </div>

                  {percent !== null && (
                    <div className="shrink-0 text-xs font-semibold text-slate-100">
                      {percent}%
                    </div>
                  )}
                </div>

                <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-violet-600 transition-[width] duration-200"
                    style={{ width: `${percent ?? 18}%` }}
                  />
                </div>

                <div className="mt-2 text-[11px] text-slate-400">
                  Ne ferme pas l’onglet pendant l’envoi.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
