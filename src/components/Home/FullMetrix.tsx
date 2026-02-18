// src/components/Home/FullMetrix.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import introBlack from "../../assets/Miniatures.webp";

const VIDEO_SOURCE =
  "https://www.youtube.com/watch?v=UwhkJYMR_90&feature=youtu.be";

function toEmbedUrl(url: string) {
  try {
    const u = new URL(url);

    const id =
      u.searchParams.get("v") ||
      (u.hostname.includes("youtu.be") ? u.pathname.replace("/", "") : "") ||
      u.pathname.split("/").filter(Boolean).pop();

    const safeId = (id || "").trim() || "UwhkJYMR_90";
    const base = `https://www.youtube.com/embed/${safeId}`;

    const params = new URLSearchParams({
      autoplay: "1",
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
    }).toString();

    return `${base}?${params}`;
  } catch {
    return "https://www.youtube.com/embed/UwhkJYMR_90?autoplay=1&rel=0&modestbranding=1&playsinline=1";
  }
}

function IconPlay({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconX({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function VideoModal({
  open,
  onClose,
  embedUrl,
}: {
  open: boolean;
  onClose: () => void;
  embedUrl: string;
}) {
  // ESC + lock scroll
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const node = (
    <div
      className="fixed inset-0 z-[9999] h-[100svh] w-screen"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/90"
        onClick={handleBackdropClick}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[10000] w-10 h-10 rounded-full bg-black/70 text-white grid place-items-center"
        aria-label="Fermer"
        type="button"
      >
        <IconX />
      </button>

      <div className="absolute inset-0 z-[9999]">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title="Vidéo de présentation FullMetrix"
        />
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

export default function FullMetrix() {
  const [open, setOpen] = useState(false);
  const embedUrl = useMemo(() => toEmbedUrl(VIDEO_SOURCE), []);
  const navigate = useNavigate();

  const goDetails = () => {
    navigate("/fm-metrix/a-propos");
  };

  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10 pt-10 sm:pt-12 lg:pt-14">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-skin-base">
            Découvrez <span className="text-indigo-500">FullMetrix</span>
          </h2>

          {/* ✅ Bouton détails */}
          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={goDetails}
              className="
                inline-flex items-center justify-center
                px-5 py-2.5 rounded-full
                bg-indigo-600 text-white text-sm font-semibold
                shadow-sm hover:bg-indigo-700 active:scale-[0.98]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70
              "
              aria-label="Voir les détails de FullMetrix"
              title="Voir les détails"
            >
              Voir les détails
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10 pb-10 sm:pb-12 lg:pb-14">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="
            relative w-full
            rounded-[28px]
            overflow-hidden
            bg-skin-surface/70
            ring-1 ring-skin-border/15
            shadow-[0_18px_45px_rgba(0,0,0,0.08)]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring
          "
          aria-label="Lire la vidéo de présentation"
        >
          <img
            src={introBlack}
            alt="Interface FullMetrix"
            className="w-full h-auto object-cover block"
            loading="lazy"
          />

          <span
            className="
              absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-20 h-20 sm:w-24 sm:h-24
              rounded-full bg-white/95 text-[#5B21FF]
              grid place-items-center shadow-xl
            "
          >
            <IconPlay className="w-8 h-8 sm:w-9 sm:h-9" />
          </span>

          <span
            className="
              absolute top-4 right-4
              bg-black/35 text-white text-[11px] sm:text-xs
              px-3 py-1 rounded-full
            "
          ></span>
        </button>
      </div>

      <VideoModal
        open={open}
        onClose={() => setOpen(false)}
        embedUrl={embedUrl}
      />
    </section>
  );
}
