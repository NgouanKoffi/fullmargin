// src/pages/communaute/private/community-details/tabs/PostComposer/PostComposer/FullscreenEditor.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, CalendarClock, Trash2, Loader2, Lock, Globe2 } from "lucide-react";
import type { CreatePayload, ExistingMedia, Visibility } from "./types";
import {
  MAX_MEDIA,
  IMAGE_MAX_MB,
  VIDEO_MAX_MB,
  VIDEO_ACCEPT,
} from "./constants";
import RichPostEditor from "./RichPostEditor";

function toLocalDatetimeValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function FullscreenEditor({
  modeEditId,
  initialText,
  initialExisting,
  initialVisibility,
  onClose,
  onPublish,
  // 🔐 si false → pas de programmation / pas de visibilité publique
  canManageVisibilityAndSchedule = true,
}: {
  modeEditId?: string | null;
  initialText?: string;
  initialExisting?: ExistingMedia[];
  initialVisibility?: Visibility;
  onClose: () => void;
  onPublish: (
    payload: CreatePayload,
    mediaOps?:
      | {
          keepPublicIds: string[];
        }
      | undefined
  ) => Promise<void> | void;
  canManageVisibilityAndSchedule?: boolean;
}) {
  const [html, setHtml] = useState(initialText ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [existing, setExisting] = useState<ExistingMedia[]>(
    initialExisting || []
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 🔐 visibilité (par défaut : private)
  const [visibility, setVisibility] = useState<Visibility>(
    initialVisibility ?? "private"
  );

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  const dropRef = useRef<HTMLDivElement | null>(null);

  // date par défaut (utile seulement si l’admin peut programmer)
  useEffect(() => {
    if (!canManageVisibilityAndSchedule) return;
    const now = new Date();
    now.setMinutes(now.getMinutes() + 2);
    setScheduledAt(toLocalDatetimeValue(now));
  }, [canManageVisibilityAndSchedule]);

  // bloquer scroll arrière-plan
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // previews
  const previews = useMemo(
    () =>
      files.map((f) => ({
        file: f,
        url: URL.createObjectURL(f),
        kind: f.type.startsWith("image/") ? "image" : "video",
      })),
    [files]
  );
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  // validation fichier
  const validateFile = useCallback((f: File): string | null => {
    if (f.type.startsWith("image/")) {
      if (f.size > IMAGE_MAX_MB * 1024 * 1024)
        return `Image trop lourde (> ${IMAGE_MAX_MB} MB) : ${f.name}`;
      return null;
    }
    if (f.type.startsWith("video/")) {
      const okType = VIDEO_ACCEPT.split(",").some((t: string) => t === f.type);
      if (!okType) return `Format vidéo non supporté (${f.type}).`;
      if (f.size > VIDEO_MAX_MB * 1024 * 1024)
        return `Vidéo trop lourde (> ${VIDEO_MAX_MB} MB) : ${f.name}`;
      return null;
    }
    return "Type de fichier non supporté.";
  }, []);

  const handleAddFiles = useCallback(
    (incoming0: File[]) => {
      setError(null);
      let incoming = incoming0;

      const currentCount =
        existing.filter((m) => !m._removed).length + files.length;
      if (currentCount + incoming.length > MAX_MEDIA) {
        incoming = incoming.slice(0, MAX_MEDIA - currentCount);
        setError(`Maximum ${MAX_MEDIA} médias.`);
      }

      const ok: File[] = [];
      const bad: string[] = [];
      for (const f of incoming) {
        const err = validateFile(f);
        if (err) bad.push(err);
        else ok.push(f);
      }
      if (bad.length) setError(bad[0]);
      if (ok.length) setFiles((prev) => [...prev, ...ok]);
    },
    [existing, files.length, validateFile]
  );

  // drag & drop
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const prevent = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onDrop = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const de = e as DragEvent;
      if (!de.dataTransfer) return;
      handleAddFiles(Array.from(de.dataTransfer.files));
    };
    ["dragenter", "dragover", "dragleave"].forEach((ev) =>
      el.addEventListener(ev, prevent)
    );
    el.addEventListener("drop", onDrop);
    return () => {
      ["dragenter", "dragover", "dragleave"].forEach((ev) =>
        el.removeEventListener(ev, prevent)
      );
      el.removeEventListener("drop", onDrop);
    };
  }, [handleAddFiles]);

  const removeNewAt = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  };
  const toggleRemoveExisting = (publicId: string) => {
    setExisting((prev) =>
      prev.map((m) =>
        m.publicId === publicId ? { ...m, _removed: !m._removed } : m
      )
    );
  };

  const scheduledIso = useMemo(() => {
    if (!canManageVisibilityAndSchedule) return null;
    if (!isScheduled) return null;
    if (!scheduledAt) return null;
    const dt = new Date(scheduledAt);
    if (Number.isNaN(dt.getTime())) return null;
    if (dt.getTime() < Date.now() + 60 * 1000) return null;
    return dt.toISOString();
  }, [canManageVisibilityAndSchedule, isScheduled, scheduledAt]);

  const canPublish =
    html.trim().length > 0 ||
    files.length > 0 ||
    existing.some((m) => !m._removed);

  const publishNow = async () => {
    if (!canPublish || submitting) return;

    // 🔐 si l’utilisateur n’a pas le droit → toujours privé et sans programmation
    const effectiveVisibility: Visibility = canManageVisibilityAndSchedule
      ? visibility
      : "private";

    const effectiveScheduledAt =
      canManageVisibilityAndSchedule && isScheduled ? scheduledIso : null;

    const basePayload: CreatePayload = {
      text: html.trim(),
      files,
      scheduledAt: effectiveScheduledAt,
      visibility: effectiveVisibility,
    };

    setSubmitting(true);
    try {
      if (modeEditId) {
        const keep = existing
          .filter((m) => !m._removed)
          .map((m) => m.publicId)
          .filter(Boolean);
        await onPublish(basePayload, { keepPublicIds: keep });
      } else {
        await onPublish(basePayload);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const scheduleInvalid =
    canManageVisibilityAndSchedule && isScheduled && !scheduledIso;

  const body = (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0 flex flex-col">
        {/* top bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white/95 dark:bg-slate-900/95 ring-1 ring-black/10 dark:ring-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="text-sm sm:text-base font-semibold">
              {modeEditId ? "Modifier la publication" : "Nouveau post"}
            </span>
          </div>
          {/* bouton toujours visible, même sur mobile */}
          <button
            type="button"
            onClick={publishNow}
            disabled={!canPublish || submitting || scheduleInvalid}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              !canPublish || submitting || scheduleInvalid
                ? "bg-slate-200 text-slate-500 dark:bg-white/5 dark:text-slate-500 cursor-not-allowed"
                : "bg-violet-600 text-white hover:bg-violet-700"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {modeEditId
                  ? "Mise à jour…"
                  : canManageVisibilityAndSchedule && isScheduled
                  ? "Programmation…"
                  : "Publication…"}
              </>
            ) : modeEditId ? (
              "Mettre à jour"
            ) : canManageVisibilityAndSchedule && isScheduled ? (
              "Programmer"
            ) : (
              "Publier"
            )}
          </button>
        </div>

        {/* content plein écran, aligné à gauche */}
        <div className="flex-1 overflow-auto">
          <div className="min-h-full w-full px-4 sm:px-6 py-4 lg:pl-10 lg:pr-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start">
              {/* gauche : éditeur large */}
              <div className="flex-1 min-w-0 w-full">
                <div className="bg-white/90 dark:bg-slate-900/40 rounded-xl ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
                  <RichPostEditor
                    value={html}
                    onChange={setHtml}
                    onSelectImages={(f) => handleAddFiles(f)}
                    onSelectVideos={(f) => handleAddFiles(f)}
                    placeholder={
                      modeEditId
                        ? "Modifier le texte de la publication…"
                        : "Quoi de neuf ? Partagez un message, des images ou une vidéo…"
                    }
                  />
                </div>
              </div>

              {/* droite : colonne */}
              <div className="w-full lg:w-[360px] flex flex-col gap-4">
                {/* dropzone */}
                <div
                  ref={dropRef}
                  className="rounded-xl border border-dashed border-slate-300/70 dark:border-slate-600/50 bg-white/80 dark:bg-white/5 p-3"
                >
                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                    Glissez-déposez ici pour ajouter d’autres fichiers. Images ≤{" "}
                    {IMAGE_MAX_MB} MB • Vidéos ≤ {VIDEO_MAX_MB} MB • max{" "}
                    {MAX_MEDIA}.
                  </p>

                  {error ? (
                    <div className="mb-2 text-xs text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3">
                    {existing
                      .filter((m) => !m._removed)
                      .map((m) => (
                        <figure
                          key={`old-${m.publicId}`}
                          className="relative group rounded-lg overflow-hidden ring-1 ring-black/10 dark:ring-white/10 bg-black/5"
                        >
                          {m.type === "image" ? (
                            <img
                              src={m.url}
                              alt=""
                              className="w-full h-24 object-cover"
                            />
                          ) : (
                            <video
                              src={m.url}
                              className="w-full h-24 object-cover"
                              muted
                              controls
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => toggleRemoveExisting(m.publicId)}
                            className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition"
                            title="Retirer ce média"
                            disabled={submitting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </figure>
                      ))}

                    {previews.map((p, i) => (
                      <figure
                        key={`new-${i}`}
                        className="relative group rounded-lg overflow-hidden ring-1 ring-black/10 dark:ring-white/10 bg-black/5"
                      >
                        {p.kind === "image" ? (
                          <img
                            src={p.url}
                            alt=""
                            className="w-full h-24 object-cover"
                          />
                        ) : (
                          <video
                            src={p.url}
                            className="w-full h-24 object-cover"
                            muted
                            controls
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeNewAt(i)}
                          className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition"
                          title="Retirer ce média"
                          disabled={submitting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </figure>
                    ))}
                  </div>
                </div>

                {/* programmation – visible seulement pour les admins */}
                {canManageVisibilityAndSchedule && (
                  <div className="rounded-xl ring-1 ring-black/10 dark:ring-white/10 bg-white/90 dark:bg-white/5 p-4">
                    <label className="flex items-center gap-2 text-sm font-medium mb-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={isScheduled}
                        onChange={(e) => setIsScheduled(e.target.checked)}
                        disabled={submitting}
                      />
                      <span className="inline-flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-violet-600" />
                        Programmer la publication
                      </span>
                    </label>

                    {isScheduled ? (
                      <>
                        <input
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={(e) => setScheduledAt(e.target.value)}
                          className="w-full rounded-lg px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 bg-white dark:bg-slate-900/70 text-sm mb-2 focus:outline-none focus:ring-0"
                          disabled={submitting}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                          Le post sera publié automatiquement à cette
                          date/heure.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                        Cochez pour définir une date de publication.
                      </p>
                    )}

                    {scheduleInvalid && (
                      <div className="mt-1 text-xs text-amber-600">
                        Choisissez une date/heure valide (au moins +1 minute).
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={publishNow}
                      disabled={!canPublish || submitting || scheduleInvalid}
                      className={`mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                        !canPublish || submitting || scheduleInvalid
                          ? "bg-slate-200 text-slate-500 dark:bg-white/5 dark:text-slate-500 cursor-not-allowed"
                          : "bg-violet-600 text-white hover:bg-violet-700"
                      }`}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {modeEditId
                            ? "Mise à jour…"
                            : isScheduled
                            ? "Programmation…"
                            : "Publication…"}
                        </>
                      ) : modeEditId ? (
                        "Mettre à jour"
                      ) : isScheduled ? (
                        "Programmer"
                      ) : (
                        "Publier"
                      )}
                    </button>
                  </div>
                )}

                {/* 🔐 visibilité du post – visible seulement pour les admins */}
                {canManageVisibilityAndSchedule && (
                  <div className="rounded-xl ring-1 ring-black/10 dark:ring-white/10 bg-slate-900/80 dark:bg-slate-900/80 p-4">
                    <p className="text-sm font-medium text-slate-50">
                      Visibilité du post
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Par défaut, le post est privé (visible seulement dans la
                      communauté). Tu peux le rendre public si tu veux qu’il
                      apparaisse dans l’écosystème FullMargin.
                    </p>

                    <div className="mt-3 space-y-2">
                      {/* Post privé */}
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => setVisibility("private")}
                        aria-pressed={visibility === "private"}
                        className={`w-full inline-flex items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm transition-colors ${
                          visibility === "private"
                            ? "bg-slate-800 text-slate-50 border border-slate-400 shadow-sm"
                            : "bg-transparent text-slate-300 border border-slate-600/70 hover:bg-slate-800/60"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          <span>Post privé (par défaut)</span>
                        </span>
                        {visibility === "private" && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                            Actif
                          </span>
                        )}
                      </button>

                      {/* Post public */}
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => setVisibility("public")}
                        aria-pressed={visibility === "public"}
                        className={`w-full inline-flex items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm transition-colors ${
                          visibility === "public"
                            ? "bg-violet-600 text-white border border-violet-400 shadow-lg shadow-violet-600/40"
                            : "bg-transparent text-slate-300 border border-slate-600/70 hover:bg-slate-800/60"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Globe2 className="h-4 w-4" />
                          <span>Post public</span>
                        </span>
                        {visibility === "public" && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-white/90">
                            Sélectionné
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* bouton mobile du bas supprimé, on garde celui du top */}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(body, document.body);
}
