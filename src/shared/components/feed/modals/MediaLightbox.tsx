// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\components\feed\modals\MediaLightbox.tsx
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Media } from "../types";
import useLockBodyScroll from "../hooks/useLockBodyScroll";
import useKey from "../hooks/useKey";

export default function MediaLightbox({
  open,
  onClose,
  items,
  startIndex = 0,
}: {
  open: boolean;
  onClose: () => void;
  items: Media[];
  startIndex?: number;
}) {
  const [index, setIndex] = useState(startIndex);
  useEffect(() => setIndex(startIndex), [startIndex, open]);
  useLockBodyScroll(open);

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + items.length) % items.length),
    [items.length]
  );
  const next = useCallback(
    () => setIndex((i) => (i + 1) % items.length),
    [items.length]
  );

  useKey("Escape", () => open && onClose(), open);
  useKey("ArrowLeft", () => open && prev(), open);
  useKey("ArrowRight", () => open && next(), open);

  if (!open) return null;
  const current = items[index];

  // 🔒 Rendu dans un Portal pour éviter les parents transformés / sticky bars
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] bg-black/90"
      onClick={onClose}
    >
      {/* Bouton fermer */}
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-4 right-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Nav gauche/droite */}
      {items.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Précédent"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Suivant"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </>
      )}

      {/* Contenu centré, full viewport, sans marge */}
      <div
        className="absolute inset-0 grid place-items-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-6xl w-full">
          <div className="relative w-full overflow-hidden rounded-xl ring-1 ring-white/10 bg-black">
            {current.type === "image" ? (
              <img
                src={current.url}
                alt=""
                className="w-full h-auto max-h-[85vh] object-contain mx-auto block"
              />
            ) : (
              <video
                controls
                autoPlay
                preload="metadata"
                poster={current.thumbnail}
                className="w-full h-auto max-h-[85vh]"
              >
                <source src={current.url} />
              </video>
            )}
          </div>

          {items.length > 1 && (
            <div className="mt-3 flex items-center justify-center gap-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-2.5 rounded-full transition-all ${
                    i === index
                      ? "w-6 bg-white"
                      : "w-2.5 bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
