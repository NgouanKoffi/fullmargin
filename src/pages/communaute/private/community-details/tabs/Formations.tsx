// src/pages/communaute/private/community-details/tabs/Formations.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2, Trash2, X } from "lucide-react";

import {
  deleteCourse,
  listCourses,
  type CourseSaved,
} from "./Formations/formations.api";
import type { CourseDraft, Level } from "./Formations/types";
import FormationsWizardInner from "./Formations/FormationsWizard";
import { CourseList } from "./Formations/CourseList";
import { AssignCourseAccessTab } from "./Formations/AssignCourseAccessTab";

/* ---------- Types locaux (on étend les agrégats venant du backend) ---------- */
export type CourseSavedWithAgg = CourseSaved & {
  ratingAvg?: number | null;
  reviewsCount?: number;
  enrollmentCount?: number;
};

const allowedLevels: Level[] = [
  "Débutant",
  "Intermédiaire",
  "Avancé",
  "Tous niveaux",
];

const ensureLevel = (v: string): Level =>
  (allowedLevels as string[]).includes(v) ? (v as Level) : "Tous niveaux";

type SubTab = "formations" | "access";

type DeleteModalState = {
  open: boolean;
  courseId: string | null;
};

function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

function ConfirmDeleteModal({
  open,
  title,
  description,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  dangerNote,
  loading,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  dangerNote?: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-3 sm:px-6"
      aria-modal="true"
      role="dialog"
      aria-label="Confirmation suppression"
    >
      {/* backdrop */}
      <button
        type="button"
        onClick={loading ? undefined : onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Fermer"
      />

      {/* panel */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950/95 text-slate-50 shadow-2xl">
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 ring-1 ring-rose-500/25">
                <Trash2 className="h-4 w-4 text-rose-300" />
              </span>
              <h3 className="text-base sm:text-lg font-semibold truncate">
                {title}
              </h3>
            </div>

            {description && (
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                {description}
              </p>
            )}

            {dangerNote && (
              <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                {dangerNote}
              </div>
            )}

            {error && (
              <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100 whitespace-pre-line">
                {error}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={loading ? undefined : onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-white/15 hover:bg-white/5"
            aria-label="Fermer"
            title="Fermer"
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 sm:p-5 pt-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-white/15 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed"
            aria-busy={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FormationsPage({
  canCreate = false,
  communityId: communityIdFromParent,
}: {
  canCreate?: boolean;
  communityId?: string;
}) {
  const { id: idFromRoute, communityId: idFromRoute2 } = useParams();
  const [sp] = useSearchParams();

  const idFromQuery = sp.get("communityId") || sp.get("id") || "";
  const idFromLS =
    typeof window !== "undefined"
      ? localStorage.getItem("fm:last-community-id") || ""
      : "";

  const communityId = String(
    communityIdFromParent ||
      idFromRoute ||
      idFromRoute2 ||
      idFromQuery ||
      idFromLS ||
      ""
  );

  useEffect(() => {
    if (communityId) {
      try {
        localStorage.setItem("fm:last-community-id", communityId);
      } catch {
        /* ignore */
      }
    }
  }, [communityId]);

  const [mode, setMode] = useState<"list" | "editor">("list");
  const [courses, setCourses] = useState<CourseSavedWithAgg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingDraft, setEditingDraft] = useState<CourseDraft | null>(null);
  const [editingMeta, setEditingMeta] = useState<
    { id?: string; createdAt?: string } | undefined
  >(undefined);

  const [subTab, setSubTab] = useState<SubTab>("formations");

  /* ✅ Delete modal state */
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    open: false,
    courseId: null,
  });
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const deleteTarget = useMemo(() => {
    if (!deleteModal.courseId) return null;
    return courses.find((c) => c.id === deleteModal.courseId) ?? null;
  }, [deleteModal.courseId, courses]);

  const refresh = useCallback(async () => {
    if (!communityId) return;
    try {
      setLoading(true);
      setError(null);
      const list = await listCourses(communityId);
      setCourses(list as CourseSavedWithAgg[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onNew = () => {
    if (!canCreate) return;
    localStorage.removeItem("fm:course-draft");
    setEditingDraft(null);
    setEditingMeta(undefined);
    setMode("editor");
  };

  const onEdit = (c: CourseSavedWithAgg) => {
    if (!canCreate) return;

    const draft: CourseDraft = {
      title: c.title,
      level: ensureLevel(c.level ?? ""),
      coverFile: null,
      coverPreview: c.coverUrl ?? null,
      learnings: c.learnings ?? [],
      shortDesc: c.shortDesc ?? "",
      longDesc: c.description ?? "",
      modules: (c.modules ?? []).map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description ?? "",
        lessons: (m.lessons ?? []).map((l) => ({
          id: l.id,
          title: l.title,
          description: l.description ?? "",
          items: (l.items ?? []).map((it) => ({
            id: it.id,
            type: it.type,
            title: it.title ?? "",
            url: it.url ?? "",
            filename: null,
            file: null,
            __serializedFile: null,
            durationMin: it.durationMin ?? undefined,
            subtype: it.subtype ?? (it.type === "image" ? "image" : "doc"),
          })),
        })),
      })),
      priceType: c.priceType ?? "free",
      currency: c.currency || "USD",
      price: c.price,
      visibility: c.visibility ?? "public",
    };

    localStorage.removeItem("fm:course-draft");
    setEditingDraft(draft);
    setEditingMeta({ id: c.id, createdAt: c.createdAt });
    setMode("editor");
  };

  /* ✅ Ouvre un vrai modal (plus de confirm/alert) */
  const onDeleteCourse = async (id: string) => {
    if (!canCreate) return;
    setDeleteErr(null);
    setDeleteModal({ open: true, courseId: id });
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteErr(null);
    setDeleteModal({ open: false, courseId: null });
  };

  const confirmDelete = async () => {
    if (!canCreate) return;
    if (!deleteModal.courseId) return;

    try {
      setDeleting(true);
      setDeleteErr(null);

      await deleteCourse(deleteModal.courseId);
      await refresh();

      setDeleteModal({ open: false, courseId: null });
    } catch (e) {
      setDeleteErr(e instanceof Error ? e.message : "Suppression impossible");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaved = async () => {
    setEditingDraft(null);
    setEditingMeta(undefined);
    setMode("list");
    await refresh();
  };

  const handleCancel = () => {
    setEditingDraft(null);
    setEditingMeta(undefined);
    setMode("list");
  };

  if (!communityId) {
    return (
      <div className="w-full">
        <div className="mt-4 rounded-2xl border border-rose-200/70 bg-rose-50/90 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          communityId manquant. Ouvre cette page depuis une communauté (ou
          ajoute ?communityId=ID).
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {/* ✅ Modal suppression */}
      <ConfirmDeleteModal
        open={deleteModal.open}
        title="Supprimer la formation ?"
        description={
          deleteTarget
            ? `Tu es sur le point de supprimer définitivement “${deleteTarget.title}”.`
            : "Tu es sur le point de supprimer définitivement cette formation."
        }
        dangerNote="Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        loading={deleting}
        error={deleteErr}
        onClose={closeDelete}
        onConfirm={confirmDelete}
      />

      {/* Header + mini tabview */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-2">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 truncate">
            Formations de la communauté
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Crée, organise et gère les formations proposées dans cette
            communauté.
          </p>
        </div>

        {canCreate && (
          <div className="flex justify-start sm:justify-end mt-2 sm:mt-0">
            <div className="inline-flex items-center rounded-full border border-violet-500/70 bg-slate-900/90 px-1.5 py-1 shadow-lg shadow-violet-500/25">
              <button
                type="button"
                onClick={() => setSubTab("formations")}
                className={[
                  "relative px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200",
                  subTab === "formations"
                    ? "bg-violet-500 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)] shadow-violet-500/60"
                    : "text-slate-300/80 hover:text-white hover:bg-slate-800/80",
                ].join(" ")}
              >
                Formations
              </button>
              <button
                type="button"
                onClick={() => setSubTab("access")}
                className={[
                  "relative px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200",
                  subTab === "access"
                    ? "bg-violet-500 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)] shadow-violet-500/60"
                    : "text-slate-300/80 hover:text-white hover:bg-slate-800/80",
                ].join(" ")}
              >
                Accès
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Onglet Formations : liste + éditeur */}
      {subTab === "formations" && (
        <>
          {mode === "editor" ? (
            <FormationsWizardInner
              communityId={communityId}
              initialDraft={editingDraft}
              editingMeta={editingMeta}
              onCancel={handleCancel}
              onSaved={handleSaved}
            />
          ) : (
            <CourseList
              canCreate={canCreate}
              loading={loading}
              error={error}
              courses={courses}
              onNew={onNew}
              onEdit={onEdit}
              onDeleteCourse={onDeleteCourse}
            />
          )}
        </>
      )}

      {/* Onglet Attribuer accès : réservé au owner/canCreate */}
      {subTab === "access" && (
        <AssignCourseAccessTab
          canCreate={canCreate}
          communityId={communityId}
          courses={courses}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
}
