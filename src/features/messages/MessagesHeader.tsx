// src/components/messages/MessagesHeader.tsx
import type { Conversation } from "./useConversations";
import { ArrowLeft, Settings, X } from "lucide-react";
import clsx from "clsx";

type Props = {
  activeConv: Conversation | null;
  membersCount?: number;
  isGroupAdmin: boolean;
  headerAvatarUrl?: string;
  onBackFromThread: () => void;
  onClose: () => void;
  onOpenGroupSettings: () => void;
};

export function MessagesHeader({
  activeConv,
  membersCount,
  isGroupAdmin,
  headerAvatarUrl,
  onBackFromThread,
  onClose,
  onOpenGroupSettings,
}: Props) {
  const isGroup = activeConv?.variant === "group";

  const subtitle = activeConv
    ? activeConv.variant === "private"
      ? "Discussion privée avec l’administrateur."
      : "Discussion de groupe (membres du groupe)."
    : "Discute en privé avec les admins ou avec tes groupes.";

  const avatarSrc = headerAvatarUrl || activeConv?.avatar || undefined;
  const fallbackInitials = (activeConv?.name || "?").slice(0, 2).toUpperCase();

  return (
    <div className="relative px-4 sm:px-5 pt-4 pb-2">
      <div className="flex items-center gap-3">
        {/* Bouton retour (affiché seulement quand un thread est ouvert) */}
        {activeConv && (
          <button
            type="button"
            onClick={onBackFromThread}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 mr-1 shrink-0"
            aria-label="Revenir à la liste"
            title="Revenir à la liste"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        {/* Avatar + titre + sous-titre */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {activeConv && (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/5 dark:bg:white/10 overflow-hidden grid place-items-center text-[11px] shrink-0 border border-white/60">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                fallbackInitials
              )}
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <h3 className="text-base sm:text-lg font-semibold truncate">
              {activeConv ? activeConv.name : "Messages"}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Badge + réglages : toujours visibles, même en petit écran */}
        {isGroup && (
          <div className="ml-2 flex items-center gap-2 shrink-0">
            {typeof membersCount === "number" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-black/10 dark:bg-white/10 text-slate-700 dark:text-slate-100 whitespace-nowrap">
                {membersCount}
                {/* membre{membersCount > 1 ? "s" : ""} */}
              </span>
            )}

            {isGroupAdmin && (
              <button
                type="button"
                onClick={onOpenGroupSettings}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                aria-label="Paramètres du groupe"
                title="Paramètres du groupe"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Bouton fermeture sheet */}
        <div className="ml-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={clsx(
              "inline-flex items-center justify-center w-9 h-9 rounded-full",
              "ring-1 ring-skin-border/20 bg-white/60 dark:bg-white/10",
              "hover:bg-white/80 dark:hover:bg-white/15",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring"
            )}
            aria-label="Fermer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ❌ on supprime complètement le badge mobile centré qui fout le bazar
      {isGroup && typeof membersCount === "number" && (
        <div className="mt-2 sm:hidden flex justify-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] bg-black/8 dark:bg-white/10 text-slate-700 dark:text-slate-100">
            {membersCount} membre{membersCount > 1 ? "s" : ""}
          </span>
        </div>
      )} */}
    </div>
  );
}
