// src/pages/marketplace/public/ProductPreview/components/DescriptionModal.tsx
import type React from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export type DescriptionModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  short?: React.ReactNode;
  long?: React.ReactNode;
};

export default function DescriptionModal({
  open,
  onClose,
  title,
  short,
  long,
}: DescriptionModalProps) {
  // ESC + lock scroll
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop (light/dark) */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenu */}
      <div className="relative z-[1] flex h-full w-full items-stretch justify-center p-0 sm:p-4">
        <div
          className="
            w-full h-full
            sm:h-auto sm:max-h-[calc(100vh-2rem)]
            sm:w-[min(100%,56rem)]
            lg:w-[min(100%,72rem)]
            xl:w-[min(100%,80rem)]
            sm:rounded-2xl
            overflow-hidden
            flex flex-col
            bg-white text-neutral-900
            dark:bg-neutral-950 dark:text-white
            ring-1 ring-black/10 dark:ring-white/10
            shadow-2xl
          "
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-black/10 dark:border-white/10">
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-neutral-600 dark:text-white/70">
                Description complète
              </div>
              <div className="text-xs sm:text-sm text-neutral-500 dark:text-white/60 truncate">
                {title}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="ml-4 inline-flex h-9 w-9 items-center justify-center rounded-full
                         hover:bg-black/5 dark:hover:bg-white/10 transition"
              aria-label="Fermer"
              title="Fermer"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          </header>

          {/* Corps scrollable */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
            {short && (
              <section className="mb-6">
                <h3 className="text-xs font-semibold text-neutral-500 dark:text-white/60 mb-1">
                  RÉSUMÉ
                </h3>
                <div className="text-sm sm:text-[15px] leading-relaxed text-neutral-800 dark:text-white">
                  {short}
                </div>
              </section>
            )}

            {long && (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold text-neutral-500 dark:text-white/60 mb-1">
                  DESCRIPTION DÉTAILLÉE
                </h3>
                <div className="text-sm sm:text-[15px] leading-relaxed text-neutral-800 dark:text-white">
                  {long}
                </div>
              </section>
            )}
          </div>

          {/* Footer */}
          <footer className="px-4 sm:px-6 py-3 sm:py-4 border-t border-black/10 dark:border-white/10 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition"
            >
              Fermer
            </button>
          </footer>
        </div>
      </div>
    </div>,
    document.body
  );
}
