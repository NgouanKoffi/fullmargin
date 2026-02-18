// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\modals\AccountQuickModal.tsx
import { useEffect } from "react";
import type { ReactNode } from "react";
import { User as UserIcon, X, LogOut } from "lucide-react"; // Importer LogOut

type Props = {
  open: boolean;
  onClose: () => void;
  avatarSrc?: string;
  onGoProfile: () => void;
  onSignOut?: () => void; // Ajouter la fonction onSignOut
  headerRight?: ReactNode;
};

export default function AccountQuickModal({
  open,
  onClose,
  avatarSrc,
  onGoProfile,
  onSignOut, // Utiliser la fonction passée en props
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const Avatar = () => (
    <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-skin-border/25 bg-skin-muted/10 flex items-center justify-center shrink-0">
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt="Avatar"
          className="w-full h-full object-cover"
          draggable={false}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <UserIcon className="w-5 h-5 opacity-70" />
      )}
    </div>
  );

  const row =
    "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] " +
    "hover:bg-black/5 dark:hover:bg-white/10 transition-colors " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50" // Ajout du fond semi-transparent
      role="dialog"
      aria-modal="true"
      aria-label="Compte"
      onClick={onClose}
    >
      <div
        className="relative w-[min(92vw,420px)] rounded-2xl bg-skin-surface ring-1 ring-skin-border/25 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Option : Mon profil */}
        <div className="px-3 py-2">
          <button
            type="button"
            className={row}
            onClick={() => {
              onGoProfile();
              onClose();
            }}
          >
            <Avatar />
            <span className="flex-1 text-left">Mon profil</span>
          </button>
        </div>

        {/* Option : Se déconnecter */}
        {onSignOut && (
          <div className="px-3 py-2">
            <button
              type="button"
              className={`${row} bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500`} // Couleur rouge pour déconnexion
              onClick={() => {
                onSignOut();
                onClose();
              }}
            >
              <LogOut className="w-5 h-5" />
              <span className="flex-1 text-left">Se déconnecter</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
