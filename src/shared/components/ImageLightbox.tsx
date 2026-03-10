import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type LightboxImage = { src: string; alt?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  src?: string;
  alt?: string;
  images?: LightboxImage[];
  startAt?: number;
};

export default function ImageLightbox({
  open,
  onClose,
  src,
  alt,
  images = [],
  startAt = 0,
}: Props) {
  // Unifier en liste d'images
  const normalizedImages = useMemo(() => {
    if (images && images.length > 0) return images;
    if (src) return [{ src, alt }];
    return [];
  }, [images, src, alt]);

  const [idx, setIdx] = useState<number>(0);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      const initialIdx = Math.max(0, Math.min(startAt, normalizedImages.length - 1));
      setIdx(initialIdx);
    }
  }, [open, startAt, normalizedImages.length]);

  const prev = useCallback(
    () => setIdx((i) => (i - 1 + normalizedImages.length) % normalizedImages.length),
    [normalizedImages.length]
  );
  const next = useCallback(
    () => setIdx((i) => (i + 1) % normalizedImages.length),
    [normalizedImages.length]
  );

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    },
    [open, onClose, prev, next]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKey);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, handleKey]);

  if (!open || !normalizedImages.length) return null;
  if (typeof document === "undefined") return null;

  const cur = normalizedImages[idx];

  const content = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-[2px] flex items-center justify-center"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <button
        className="absolute top-6 right-6 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95"
        onClick={onClose}
        aria-label="Fermer"
      >
        <X className="w-6 h-6" />
      </button>

      {normalizedImages.length > 1 && (
        <>
          <button
            className="absolute left-6 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95"
            onClick={prev}
            aria-label="Précédent"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            className="absolute right-6 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95"
            onClick={next}
            aria-label="Suivant"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <figure className="max-w-[95vw] max-h-[85vh] p-4 flex flex-col items-center gap-4">
        <img
          src={cur.src}
          alt={cur.alt || ""}
          className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300"
          draggable={false}
        />
        {cur.alt && (
          <figcaption className="text-white/70 text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
            {cur.alt}
          </figcaption>
        )}
      </figure>
    </div>
  );

  return createPortal(content, document.body);
}

import { useMemo } from "react";
