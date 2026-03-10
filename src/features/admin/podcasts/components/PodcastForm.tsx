// src/pages/admin/podcasts/composants/PodcastForm.tsx
import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "../constants";
import { fmtDuration } from "../utils";
import type { Podcast } from "../types";
import { Image as ImageIcon, Music2, UploadCloud, Loader2 } from "lucide-react";

const LANGUAGE_OPTIONS: ReadonlyArray<{ value: "fr" | "en"; label: string }> = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

export default function PodcastForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Podcast>;
  onSubmit: (
    values: Partial<Podcast> & { fileAudio?: File; fileCover?: File }
  ) => void | Promise<void>;
  onCancel?: () => void;
}) {
  // Champs
  const [title, setTitle] = useState(initial?.title ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [html, setHtml] = useState(initial?.html ?? "");
  const [language, setLanguage] = useState<"fr" | "en">(
    (initial?.language as "fr" | "en" | undefined) ?? "fr"
  );

  // Fichiers + preview + durée
  const [fileCover, setFileCover] = useState<File | undefined>();
  const [fileAudio, setFileAudio] = useState<File | undefined>();
  const [previewCover, setPreviewCover] = useState<string | undefined>(
    initial?.coverUrl
  );
  const [previewAudio, setPreviewAudio] = useState<string | undefined>(
    initial?.audioUrl
  );
  const [duration, setDuration] = useState<number | undefined>(
    initial?.duration
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (fileCover) {
      const url = URL.createObjectURL(fileCover);
      setPreviewCover(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [fileCover]);

  useEffect(() => {
    if (fileAudio) {
      const url = URL.createObjectURL(fileAudio);
      setPreviewAudio(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [fileAudio]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onMeta = () => setDuration(el.duration || undefined);
    el.addEventListener("loadedmetadata", onMeta);
    return () => el.removeEventListener("loadedmetadata", onMeta);
  }, [previewAudio]);

  const [showPreview, setShowPreview] = useState(true);

  // submit
  const [isSubmitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const tickRef = useRef<number | null>(null);

  function startProgress() {
    setProgress(0);
    stopProgress();
    tickRef.current = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        const inc = Math.floor(2 + Math.random() * 6);
        return Math.min(p + inc, 90);
      });
    }, 120);
  }
  function stopProgress() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    // ✅ validations côté client
    const hasCover = !!fileCover || !!initial?.coverUrl;
    const hasAudio = !!fileAudio || !!initial?.audioUrl;
    const hasHtml = !!html && html.trim().length > 0;
    const hasTitle = !!title.trim();
    const hasCategory = !!category.trim();

    if (!hasTitle) {
      setErrorMsg("Le titre est obligatoire.");
      return;
    }
    if (!hasCategory) {
      setErrorMsg("La catégorie est obligatoire.");
      return;
    }
    if (!hasCover) {
      setErrorMsg("La photo de couverture est obligatoire.");
      return;
    }
    if (!hasAudio) {
      setErrorMsg("Le fichier audio est obligatoire.");
      return;
    }
    if (!hasHtml) {
      setErrorMsg("La description est obligatoire.");
      return;
    }

    setSubmitting(true);
    startProgress();
    try {
      await Promise.resolve(
        onSubmit({
          title: title.trim(),
          author: author.trim() || undefined,
          category: category.trim(),
          html,
          duration,
          fileAudio,
          fileCover,
          language,
        })
      );
      stopProgress();
      setProgress(100);
      setTimeout(() => {
        setSubmitting(false);
      }, 250);
    } catch (err: unknown) {
      stopProgress();
      setSubmitting(false);
      setProgress(0);
      const msg =
        err instanceof Error ? err.message : "Échec de l’enregistrement";
      setErrorMsg(msg);
    }
  }

  return (
    <form className="relative grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
      {isSubmitting && (
        <div className="pointer-events-none absolute -top-3 left-0 right-0">
          <div className="h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-violet-600/80 transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1 text-right text-xs opacity-70">{progress}%</div>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      <fieldset disabled={isSubmitting} className="grid grid-cols-1 gap-6">
        {/* ===== Informations ===== */}
        <section className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-black/10 dark:bg-neutral-900/60 dark:ring-white/10">
          <h4 className="mb-4 text-sm font-semibold opacity-80">
            Informations
          </h4>

          <div className="grid grid-cols-1 gap-4">
            <div className="grid gap-2">
              <label className="text-sm opacity-70">Titre *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Titre du podcast"
                className="w-full rounded-xl px-3 py-2 ring-1 ring-black/10 outline-none disabled:opacity-60 dark:bg-neutral-900 dark:ring-white/10"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm opacity-70">Catégorie *</label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl px-3 py-2 ring-1 ring-black/10 disabled:opacity-60 dark:bg-neutral-900 dark:ring-white/10"
              >
                <option value="" disabled>
                  Sélectionner…
                </option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm opacity-70">Langue *</label>
              <select
                required
                value={language}
                onChange={(e) => setLanguage(e.target.value as "fr" | "en")}
                className="w-full rounded-xl px-3 py-2 ring-1 ring-black/10 disabled:opacity-60 dark:bg-neutral-900 dark:ring-white/10"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm opacity-70">Auteur (optionnel)</label>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Nom de l’auteur"
                className="w-full rounded-xl px-3 py-2 ring-1 ring-black/10 outline-none disabled:opacity-60 dark:bg-neutral-900 dark:ring-white/10"
              />
            </div>
          </div>
        </section>

        {/* ===== Médias ===== */}
        <section className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-black/10 dark:bg-neutral-900/60 dark:ring-white/10">
          <h4 className="mb-4 text-sm font-semibold opacity-80">Médias</h4>

          <div className="grid grid-cols-1 gap-5">
            {/* Cover obligatoire */}
            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-sm opacity-70">
                <ImageIcon className="h-4 w-4" /> Couverture (obligatoire)
              </label>
              <div className="flex flex-col gap-3 rounded-xl border p-4 ring-1 ring-black/10 dark:border-white/10 dark:ring-white/10">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFileCover(e.target.files?.[0])}
                  className="w-full rounded-xl bg-white/70 px-3 py-2 ring-1 ring-black/10 file:mr-3 file:rounded-lg file:border-0 file:bg-black/5 file:px-3 file:py-2 disabled:opacity-60 dark:bg-neutral-900/60 dark:ring-white/10 dark:file:bg-white/10"
                />
                <div className="grid place-items-center rounded-lg bg-black/5 p-2 dark:bg-white/5">
                  {previewCover ? (
                    <img
                      src={previewCover}
                      alt="Preview cover"
                      className="max-h-80 w-full object-contain"
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex items-center gap-2 py-16 opacity-60">
                      <ImageIcon className="h-5 w-5" /> Aucune couverture
                      sélectionnée
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Audio obligatoire */}
            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-sm opacity-70">
                <UploadCloud className="h-4 w-4" /> Fichier audio (obligatoire)
              </label>
              <div className="grid gap-3 rounded-xl border p-4 ring-1 ring-black/10 dark:border-white/10 dark:ring-white/10">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setFileAudio(e.target.files?.[0])}
                  className="w-full rounded-xl bg-white/70 px-3 py-2 ring-1 ring-black/10 file:mr-3 file:rounded-lg file:border-0 file:bg-black/5 file:px-3 file:py-2 disabled:opacity-60 dark:bg-neutral-900/60 dark:ring-white/10 dark:file:bg-white/10"
                />
                <div className="rounded-lg bg-black/5 p-3 dark:bg-white/5">
                  {previewAudio ? (
                    <audio
                      ref={audioRef}
                      controls
                      src={previewAudio}
                      className="w-full"
                    />
                  ) : (
                    <div className="flex items-center gap-2 opacity-60">
                      <Music2 className="h-5 w-5" />
                      Aucun audio sélectionné
                    </div>
                  )}
                  <div className="mt-2 text-sm opacity-70">
                    Durée estimée : <strong>{fmtDuration(duration)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Description ===== */}
        <section className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-black/10 dark:bg-neutral-900/60 dark:ring-white/10">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold opacity-80">
              Description (obligatoire)
            </h4>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={showPreview}
                onChange={(e) => setShowPreview(e.target.checked)}
              />
              Aperçu en direct
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="h-[24rem] w-full resize-y rounded-xl px-3 py-2 font-mono text-sm ring-1 ring-black/10 outline-none disabled:opacity-60 dark:bg-neutral-900 dark:ring-white/10"
              placeholder="<p>Votre description…</p>"
            />
            <div className="rounded-xl ring-1 ring-black/10 dark:ring-white/10">
              <div className="border-b px-3 py-2 text-xs opacity-70 dark:border-white/10">
                Aperçu
              </div>
              <div
                className="prose max-w-none px-4 py-3 dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: showPreview
                    ? html || "<em>Aucun contenu HTML…</em>"
                    : "<em>Aperçu masqué</em>",
                }}
              />
            </div>
          </div>
        </section>
      </fieldset>

      <div className="mt-1 flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-xl px-4 py-2 ring-1 ring-black/10 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60 dark:ring-white/10 dark:hover:bg-white/10"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-white shadow hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement… {progress}%
            </>
          ) : (
            "Enregistrer"
          )}
        </button>
      </div>
    </form>
  );
}
