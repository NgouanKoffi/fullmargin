import { useEffect, useRef, useState } from "react";
import type { Row } from "../types";
import { Share2, Trash2, MoveRight, Download } from "lucide-react";
import { getNote } from "../api";
import {
  extractPreviewFromDoc,
  getPreviewCache,
  type Preview,
} from "../utils/preview";

export default function NoteCard({
  note,
  accent,
  onOpen,
  onAskMove,
  onExportPdf,
  onShare,
  onDelete,
}: {
  note: Row;
  accent: string;
  onOpen: (id: string) => void;
  onAskMove: (id: string) => void;
  onExportPdf: (id: string) => void;
  onShare: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cache = getPreviewCache();
  const [preview, setPreview] = useState<Preview | null>(
    cache.get(note.id) ?? null
  );
  const [loading, setLoading] = useState(!cache.has(note.id));
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!cache.has(note.id)) {
      setLoading(true);
      getNote(note.id)
        .then((full) => {
          const p = extractPreviewFromDoc(full.doc);
          cache.set(note.id, p);
          if (mountedRef.current) setPreview(p);
        })
        .catch(() => {
          // pas d’aperçu → on laisse null
        })
        .finally(() => mountedRef.current && setLoading(false));
    }
    return () => {
      mountedRef.current = false;
    };
  }, [note.id, cache]);

  const handleOpen = () => onOpen(note.id);
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(note.id);
    }
  };

  // petite util
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <article
      className="group rounded-2xl border border-black/15 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow transition-shadow cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKey}
      aria-label={`Ouvrir ${note.title || "note"}`}
    >
      {/* top accent */}
      <div className={`h-1 w-full bg-gradient-to-r ${accent}`} />

      {/* Aperçu image */}
      {preview?.imageUrl ? (
        <div className="relative">
          <img
            src={preview.imageUrl}
            alt=""
            className="w-full h-36 object-cover bg-slate-100 dark:bg-slate-800"
            loading="lazy"
            draggable={false}
          />
        </div>
      ) : (
        <div className="w-full h-4" /> // spacing léger si pas d’image
      )}

      {/* Contenu */}
      <div className="p-4 flex flex-col gap-2 min-h-[160px]">
        <h3 className="font-semibold line-clamp-2">
          {note.title || "Sans titre"}
        </h3>

        {/* extrait texte */}
        <p className="text-sm opacity-70 line-clamp-3">
          {loading ? "…" : preview?.text || ""}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-xs opacity-60">
            {new Date(note.updatedAt).toLocaleDateString()}
          </span>

          {/* actions — vrais <button>, mais le conteneur n’est PAS un <button> → pas d’erreur d’imbrication */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-xs"
              title="Partager"
              onClick={(e) => {
                stop(e);
                onShare(note.id);
              }}
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-xs"
              title="Exporter en PDF"
              onClick={(e) => {
                stop(e);
                onExportPdf(note.id);
              }}
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-xs"
              title="Déplacer"
              onClick={(e) => {
                stop(e);
                onAskMove(note.id);
              }}
            >
              <MoveRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-xs text-rose-600"
              title="Supprimer"
              onClick={(e) => {
                stop(e);
                onDelete(note.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
