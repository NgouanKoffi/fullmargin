// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\community-details\components\ImageLightbox.tsx
import { useEffect } from "react";
import { X } from "lucide-react";

export default function ImageLightbox({
  src,
  alt,
  open,
  onClose,
}: {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[999] ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      } transition-opacity`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-4 top-4 z-[1000] inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900 hover:bg-white"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="absolute inset-0 grid place-items-center p-4">
        <img
          src={src}
          alt={alt || ""}
          className="max-h-[92vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
        />
      </div>
    </div>
  );
}
