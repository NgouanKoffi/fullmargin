// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\sheets\BaseSheet.tsx
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  labelledById: string;
  title: string;
  headerRight?: ReactNode;
  hiddenBehind?: boolean; // Option pour rendre le sheet caché derrière
  children: ReactNode;
};

export default function BaseSheet({
  open,
  onClose,
  labelledById,
  title,
  headerRight,
  hiddenBehind = false,
  children,
}: Props) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[61] ${
        open ? "sheet sheet--open" : "sheet"
      }`}
      aria-hidden={!open}
      aria-modal={open || undefined}
      role="dialog"
      aria-labelledby={labelledById}
      style={
        hiddenBehind
          ? {
              opacity: 0,
              transform: "translateY(12px) scale(.985)",
              pointerEvents: "none",
              transition:
                "opacity 220ms ease, transform 220ms cubic-bezier(.22,.8,.3,1)",
            }
          : undefined
      }
    >
      <div className="relative w-full rounded-t-3xl bg-skin-surface ring-1 ring-skin-border/25 shadow-2xl">
        {/* handle + header */}
        <div className="px-5 pt-4">
          <div className="h-1.5 w-12 rounded-full bg-skin-border/25 dark:bg-white/30 mx-auto" />
        </div>

        <div className="px-5 pb-4 flex items-center justify-between">
          <h3 id={labelledById} className="text-skin-base font-semibold">
            {title}
          </h3>
          {headerRight}
          <button
            type="button"
            aria-label="Fermer"
            title="Fermer"
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full p-2 text-gray-500 hover:text-gray-900 hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/30"
            style={{ right: "max(12px, env(safe-area-inset-right, 0px))" }}
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
