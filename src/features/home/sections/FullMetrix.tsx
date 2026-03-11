// src/components/Home/FullMetrix.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import introBlack from "@assets/Miniatures.webp";

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
            Découvrez <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#3B82F6] to-[#8B5CF6] bg-[length:200%_auto] animate-[fm-text-shimmer_6s_linear_infinite]">FullMetrix</span>
          </h2>

          {/* ✅ Bouton détails */}
          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={goDetails}
              className="
                group relative inline-flex items-center justify-center
                px-7 py-3 rounded-full
                bg-white/5 dark:bg-[#0A0C18] border border-white/10
                text-fm-primary text-sm font-semibold
                hover:bg-fm-primary hover:border-fm-primary hover:text-white
                shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all duration-300 backdrop-blur-md
                focus:outline-none focus-visible:ring-2 focus-visible:ring-fm-primary/70
              "
              aria-label="Voir les détails de FullMetrix"
              title="Voir les détails"
            >
              Voir les détails
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1000px] px-3 sm:px-6 lg:px-10 pb-10 sm:pb-12 lg:pb-16">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="
            relative w-full group perspective-[1000px]
            rounded-[32px] sm:rounded-[48px]
            overflow-hidden
            bg-white/5 dark:bg-[#0A0C18]
            border border-white/10 dark:border-white/5
            shadow-[0_24px_60px_rgba(0,0,0,0.15)]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-fm-primary/50
          "
          aria-label="Lire la vidéo de présentation"
        >
          <img
            src={introBlack}
            alt="Interface FullMetrix"
            className="w-full h-auto aspect-video object-cover block transition-transform duration-700 group-hover:scale-[1.02]"
            loading="lazy"
          />

          <span
            className="
              absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-20 h-20 sm:w-24 sm:h-24
              rounded-full bg-white/10 dark:bg-black/40 backdrop-blur-xl
              border border-white/20 text-white
              grid place-items-center shadow-[0_8px_32px_rgba(0,0,0,0.3)]
              group-hover:scale-110 group-hover:bg-fm-primary group-hover:border-fm-primary transition-all duration-300
            "
          >
            <IconPlay className="w-8 h-8 sm:w-10 sm:h-10 ml-1" />
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
