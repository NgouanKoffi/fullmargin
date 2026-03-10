import clsx from "clsx";
import { X } from "lucide-react";

type Props = {
  groupSettingsOpen: boolean;
  setGroupSettingsOpen: (open: boolean) => void;
  groupChatLocked: boolean;
  handleToggleGroupLock: () => void;
};

export function GroupSettingsModal({
  groupSettingsOpen,
  setGroupSettingsOpen,
  groupChatLocked,
  handleToggleGroupLock,
}: Props) {
  if (!groupSettingsOpen) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex justify-end bg-black/40 backdrop-blur-[2px]"
      onClick={() => setGroupSettingsOpen(false)}
    >
      <div
        className="h-full w-full max-w-sm bg-white dark:bg-[#111318] border-l border-black/10 dark:border-white/10 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Paramètres du groupe</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Contrôle qui peut envoyer des messages.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setGroupSettingsOpen(false)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 text-sm">
          <div className="flex items-center gap-3 pr-1">
            <div className="flex-1">
              <div className="font-medium">
                Limiter l’écriture aux administrateurs
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Seuls les admins peuvent envoyer des messages quand activé.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={groupChatLocked}
              onClick={handleToggleGroupLock}
              className={clsx(
                "relative inline-flex h-6 w-11 rounded-full border transition-colors duration-150 shrink-0",
                groupChatLocked
                  ? "bg-violet-600 border-violet-600"
                  : "bg-slate-300/70 dark:bg-slate-600/70 border-transparent"
              )}
            >
              <span
                className={clsx(
                  "inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-150",
                  groupChatLocked ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
