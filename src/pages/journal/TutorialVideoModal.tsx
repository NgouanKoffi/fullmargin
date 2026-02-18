// src/pages/marketplace/tabs/shop/components/TutorialVideoModal.tsx
import { useEffect, useState } from "react";
import { X, Play } from "lucide-react";

interface TutorialVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string; // YouTube embed URL or video file URL
}

export default function TutorialVideoModal({
  isOpen,
  onClose,
  videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder - replace with actual tutorial video
}: TutorialVideoModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger entrance animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for exit animation
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Fullscreen Backdrop */}
      <div
        className={`fixed inset-0 z-50 flex flex-col bg-black transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-modal-title"
      >
        {/* Close Button - Fixed at top */}
        <div className="relative z-10 flex items-center justify-between bg-gradient-to-r from-violet-600/20 to-purple-600/20 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-600/20 sm:size-10 sm:rounded-xl">
              <Play className="size-4 text-violet-400 sm:size-5" />
            </div>
            <div>
              <h2
                id="tutorial-modal-title"
                className="text-base font-bold text-white sm:text-lg"
              >
                Comment utiliser votre journal de trading
              </h2>
              <p className="hidden text-sm text-neutral-400 sm:block">
                Regardez ce tutoriel pour bien démarrer
              </p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95 sm:px-4 sm:py-2"
            aria-label="Fermer le tutoriel"
          >
            <X className="size-4 sm:size-5" />
            <span className="text-xs font-medium sm:text-sm">Fermer</span>
          </button>
        </div>

        {/* Video Container - Takes remaining space */}
        <div className="relative flex-1 bg-black">
          {videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
            // YouTube Embed
            <iframe
              className="absolute inset-0 size-full"
              src={videoUrl}
              title="Tutoriel Marketplace"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            // HTML5 Video
            <video
              className="absolute inset-0 size-full object-contain"
              controls
              autoPlay
              src={videoUrl}
            >
              <track kind="captions" />
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="relative z-10 border-t border-neutral-800 bg-neutral-900/95 px-4 py-3 backdrop-blur-sm sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-neutral-400 sm:text-sm">
              💡 Vous pouvez revoir ce tutoriel à tout moment depuis les paramètres
            </p>
            <button
              onClick={handleClose}
              className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-500 active:scale-95 sm:w-auto sm:py-2"
            >
              J'ai compris
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
