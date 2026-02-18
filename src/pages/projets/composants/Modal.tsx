// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\projets\composants\Modal.tsx
import { useEffect } from "react";

function useBodyLock(lock: boolean) {
  useEffect(() => {
    const body = document.body;
    if (lock) body.classList.add("overflow-hidden");
    else body.classList.remove("overflow-hidden");
    return () => body.classList.remove("overflow-hidden");
  }, [lock]);
}

export default function Modal({
  ouvert,
  titre,
  children,
  onClose,
}: {
  ouvert: boolean;
  titre: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useBodyLock(ouvert);
  if (!ouvert) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-2 sm:p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-[680px] sm:rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-black/5 dark:border-white/10 px-4 sm:px-5 py-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur">
          <h3 className="text-base sm:text-lg font-semibold">{titre}</h3>
          <button
            className="rounded-lg px-3 py-1 hover:bg-black/5 dark:hover:bg-white/10"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
