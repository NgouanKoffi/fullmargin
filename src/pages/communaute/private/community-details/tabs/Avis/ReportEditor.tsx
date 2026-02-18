import { useEffect, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { REASONS } from "../../utils/constants";
import type { ReportUI } from "../../utils/mapping";

export function ReportEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ReportUI | null;
  onSave: (
    draft: Omit<
      ReportUI,
      "id" | "userId" | "createdAt" | "status" | "communityId" | "user"
    >
  ) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState<ReportUI["reason"]>("inappropriate");
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (initial) {
      setReason(initial.reason);
      setMessage(initial.message || "");
      setImages(initial.images ?? []);
    }
  }, [initial]);

  const canSubmit = message.trim().length > 8;

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const toRead = Math.min(files.length, Math.max(0, 5 - images.length));
    const next: string[] = [];
    for (let i = 0; i < toRead; i++) {
      const file = files[i];
      const dataUrl = await fileToDataUrl(file);
      next.push(dataUrl);
    }
    setImages((prev) => [...prev, ...next]);
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        await onSave({ reason, message: message.trim(), images });
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <label className="text-xs text-slate-500">Motif</label>
        <select
          className="w-full rounded-xl px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 bg-white dark:bg-slate-800 outline-none"
          value={reason}
          onChange={(e) => setReason(e.target.value as ReportUI["reason"])}
        >
          {REASONS.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-500">Détails</label>
        <textarea
          rows={4}
          className="w-full rounded-xl px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 bg-white dark:bg-slate-800 outline-none"
          placeholder="Décrivez précisément le problème…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-slate-500">Captures (max 5)</label>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl ring-1 ring-black/10 dark:ring-white/10 cursor-pointer">
            <ImageIcon className="h-4 w-4" />
            <span className="text-sm">Ajouter</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
          </label>
          <span className="text-xs opacity-70">
            {images.length} / 5 sélectionnées
          </span>
        </div>
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative">
                <img
                  src={src}
                  alt=""
                  className="h-20 w-20 object-cover rounded-lg ring-1 ring-black/10 dark:ring-white/10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setImages((p) => p.filter((_, idx) => idx !== i))
                  }
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black/70 text-white text-xs"
                  title="Retirer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 rounded-xl text-sm ring-1 ring-black/10 dark:ring-white/10"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${
            canSubmit
              ? "bg-rose-600 text-white hover:bg-rose-700"
              : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-500 cursor-not-allowed"
          }`}
        >
          {initial ? "Enregistrer" : "Envoyer"}
        </button>
      </div>
    </form>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
