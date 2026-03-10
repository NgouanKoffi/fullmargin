// src/components/messages/EmojiButton.tsx
import { useEffect, useState } from "react";
import { SmilePlus, X } from "lucide-react";
import { createPortal } from "react-dom";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

type Props = {
  onSelect: (emoji: string) => void;
};

export function EmojiButton({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ESC pour fermer
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const handleEmojiSelect = (emoji: any) => {
    const native = emoji?.native || "";
    if (native) {
      onSelect(native);
    }
    // ❌ NE PLUS fermer ici → l’utilisateur peut en choisir plusieurs
    // setOpen(false);
  };

  return (
    <>
      {/* bouton dans la barre */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/10 shrink-0"
        title="Insérer un emoji"
      >
        <SmilePlus className="w-4 h-4" />
      </button>

      {/* BOTTOM SHEET EMOJI (responsive) */}
      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[999]">
            {/* zone clic extérieur pour fermer (transparente) */}
            <div className="absolute inset-0" onClick={() => setOpen(false)} />

            {/* sheet centré en bas, qui laisse la zone de texte visible */}
            <div
              className="
                absolute
                bottom-20  /* au-dessus de la barre de message */
                left-1/2
                -translate-x-1/2
                pb-[env(safe-area-inset-bottom,0px)]
              "
              onClick={(e) => e.stopPropagation()} // ne pas fermer quand on clique dans le sheet
            >
              {/* petit header avec croix */}
              <div className="flex justify-end mb-1 pr-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
                  aria-label="Fermer les emojis"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div
                className="
                  rounded-2xl shadow-2xl border border-black/10 dark:border-white/15
                  bg-white dark:bg-[#111318]
                  overflow-hidden
                  w-[min(420px,100vw-16px)]
                  max-h-[60vh]
                  flex
                "
              >
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme="light"
                  navPosition="top"
                  previewPosition="none"
                  searchPosition="top"
                  className="!w-full"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
