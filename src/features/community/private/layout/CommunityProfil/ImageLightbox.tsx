// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\community-details\tabs\CommunityProfil\components\ui\ImageLightbox.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type LightboxImage = { src: string; alt?: string };

type Props = {
  open: boolean;
  images: LightboxImage[];
  startAt?: number;
  onClose: () => void;
};

export default function ImageLightbox({
  open,
  images,
  startAt = 0,
  onClose,
}: Props) {
  const [idx, setIdx] = useState<number>(
    Math.max(0, Math.min(startAt, images.length - 1))
  );
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // re-sync index quand startAt change
  useEffect(() => {
    setIdx(Math.max(0, Math.min(startAt, images.length - 1)));
  }, [startAt, images.length]);

  const prev = useCallback(
    () => setIdx((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );
  const next = useCallback(
    () => setIdx((i) => (i + 1) % images.length),
    [images.length]
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

    // 🔒 on bloque le scroll de la page pendant le lightbox
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, handleKey]);

  if (!open || !images.length) return null;
  if (typeof document === "undefined") return null;

  const cur = images[idx];

  const content = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-[2px] flex items-center justify-center"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <button
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
        onClick={onClose}
        aria-label="Fermer"
      >
        <X className="w-6 h-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 md:left-6 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            onClick={prev}
            aria-label="Précédent"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            className="absolute right-4 md:right-6 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            onClick={next}
            aria-label="Suivant"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <figure className="max-w-[95vw] max-h-[85vh] p-2">
        <img
          src={cur.src}
          alt={cur.alt || ""}
          className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
          draggable={false}
        />
      </figure>
    </div>
  );

  // ✅ rendu directement dans <body> → plus jamais coupé par la page
  return createPortal(content, document.body);
}
