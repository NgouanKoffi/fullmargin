// src/pages/communaute/private/community-details/tabs/DirectTab/LaunchLiveModal.tsx
import type { FC } from "react";

type LaunchMode = "instant" | "scheduled";

type LaunchLiveModalProps = {
  open: boolean;
  mode: LaunchMode;
  title: string;
  isPublic: boolean;
  launching: boolean;
  onClose: () => void;
  onChangeTitle: (val: string) => void;
  onChangeVisibility: (isPublic: boolean) => void;
  onConfirm: () => void;
};

const LaunchLiveModal: FC<LaunchLiveModalProps> = ({
  open,
  mode,
  title,
  isPublic,
  launching,
  onClose,
  onChangeTitle,
  onChangeVisibility,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-950 text-slate-50 shadow-xl border border-slate-800 p-5 space-y-4">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {mode === "instant"
              ? "Lancement immédiat"
              : "Démarrer un direct programmé"}
          </p>
          <h2 className="text-sm font-semibold">Paramètres du direct</h2>
        </header>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400">
              Titre du direct
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => onChangeTitle(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-700 bg-slate-900/80 px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400">Visibilité</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChangeVisibility(false)}
                className={`px-3 py-1.5 rounded-full text-[11px] border ${
                  !isPublic
                    ? "bg-slate-100 text-slate-900 border-slate-100"
                    : "border-slate-600 text-slate-300"
                }`}
              >
                Privé
              </button>
              <button
                type="button"
                onClick={() => onChangeVisibility(true)}
                className={`px-3 py-1.5 rounded-full text-[11px] border ${
                  isPublic
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "border-slate-600 text-slate-300"
                }`}
              >
                Public
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={launching}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-600 text-slate-200 hover:bg-slate-800/70 disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={launching || !title.trim()}
            className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {launching
              ? "Lancement…"
              : mode === "instant"
              ? "Lancer le direct"
              : "Démarrer ce direct"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaunchLiveModal;
