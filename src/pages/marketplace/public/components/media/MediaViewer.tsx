// src/pages/marketplace/public/components/media/MediaViewer.tsx
import type React from "react";
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  images: string[];
  title?: string;
  /** compat: on l'accepte mais on ne l'utilise pas */
  badgeEligible?: boolean;
  className?: string;
  showThumbnails?: boolean;
};

export default function MediaViewer({
  images,
  title,
  className = "",
  showThumbnails = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const safeImages = Array.isArray(images) ? images.filter(Boolean) : [];
  const main = safeImages[currentIndex] ?? safeImages[0] ?? "";

  const hasMany = safeImages.length > 1;

  const goNext = useCallback(() => {
    if (!hasMany) return;
    setCurrentIndex((i) => (i + 1) % safeImages.length);
  }, [hasMany, safeImages.length]);

  const goPrev = useCallback(() => {
    if (!hasMany) return;
    setCurrentIndex((i) => (i - 1 + safeImages.length) % safeImages.length);
  }, [hasMany, safeImages.length]);

  const openLightbox = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation?.();
      if (!main) return;
      setOpen(true);
    },
    [main]
  );

  const openLightboxAtIndex = useCallback(
    (idx: number, e?: React.MouseEvent) => {
      e?.stopPropagation?.();
      if (!safeImages[idx]) return;
      setCurrentIndex(idx);
      setOpen(true);
    },
    [safeImages]
  );

  const closeLightbox = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation?.();
    setOpen(false);
  }, []);

  // ESC pour fermer + flèches pour slider
  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpen(false);
      if (ev.key === "ArrowRight") goNext();
      if (ev.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, goNext, goPrev]);

  return (
    <div className={["w-full", className].join(" ")}>
      {/* IMAGE PRINCIPALE */}
      <div
        className={[
          "relative w-full overflow-hidden rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-black/5",
          "aspect-[4/3] md:aspect-[16/10] lg:aspect-[4/3] max-h-[520px]",
          "will-change-transform [transform:translateZ(0)]",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={openLightbox}
          title="Voir en grand"
          className="absolute inset-0 block"
        >
          {main ? (
            <img
              src={main}
              alt={title ?? "Image produit"}
              loading="lazy"
              className="absolute inset-0 block h-full w-full max-w-none object-cover object-center"
              style={{ backfaceVisibility: "hidden" }}
            />
          ) : (
            <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800" />
          )}
        </button>

        <button
          type="button"
          onClick={openLightbox}
          className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-xl bg-neutral-900/90 text-white px-3 py-1.5 text-xs font-medium ring-1 ring-white/10 hover:bg-neutral-900"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          Plein écran
        </button>
      </div>

      {/* MINI GALERIE EN DESSOUS */}
      {showThumbnails && hasMany && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {safeImages.slice(0, 12).map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              onDoubleClick={(e) => openLightboxAtIndex(i, e)}
              className={[
                "relative shrink-0 rounded-md ring-1 ring-black/10 dark:ring-white/10 overflow-hidden",
                "h-16 w-16 bg-white/60 dark:bg-neutral-900/60",
                i === currentIndex
                  ? "ring-2 ring-violet-500 shadow-md"
                  : "opacity-80 hover:opacity-100",
              ].join(" ")}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* LIGHTBOX plein écran via portal */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm overflow-y-auto"
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
          >
            <div className="min-h-full flex items-center justify-center p-4">
              {/* Bouton fermer */}
              <button
                type="button"
                aria-label="Fermer"
                onClick={closeLightbox}
                className="fixed top-4 right-4 inline-flex items-center justify-center rounded-full w-9 h-9 bg-white/10 text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Slider */}
              <div
                className="relative max-h-[calc(100vh-4rem)] max-w-[96vw] w-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                {hasMany && (
                  <>
                    {/* Prev */}
                    <button
                      type="button"
                      onClick={goPrev}
                      className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 text-white w-9 h-9 flex items-center justify-center"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Next */}
                    <button
                      type="button"
                      onClick={goNext}
                      className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 text-white w-9 h-9 flex items-center justify-center"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {main && (
                  <img
                    src={main}
                    alt={title ?? "Image produit"}
                    className="max-h-[calc(100vh-4rem)] max-w-full object-contain mx-auto"
                  />
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
