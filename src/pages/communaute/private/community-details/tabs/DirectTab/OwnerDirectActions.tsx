// src/pages/communaute/private/community-details/tabs/DirectTab/OwnerDirectActions.tsx
import type { FC } from "react";
import { CalendarClock, Radio } from "lucide-react";

type OwnerDirectActionsProps = {
  // lancer maintenant
  onOpenInstantLaunchModal: () => void;

  // programmation / édition
  scheduleTitle: string;
  scheduleDate: string;
  scheduleTime: string;
  scheduleIsPublic: boolean;
  editingId: string | null;
  scheduling: boolean;

  onChangeScheduleTitle: (val: string) => void;
  onChangeScheduleDate: (val: string) => void;
  onChangeScheduleTime: (val: string) => void;
  onChangeScheduleVisibility: (isPublic: boolean) => void;

  onSubmitSchedule: () => void;
  onResetEditing: () => void;
};

const OwnerDirectActions: FC<OwnerDirectActionsProps> = ({
  onOpenInstantLaunchModal,
  scheduleTitle,
  scheduleDate,
  scheduleTime,
  scheduleIsPublic,
  editingId,
  scheduling,
  onChangeScheduleTitle,
  onChangeScheduleDate,
  onChangeScheduleTime,
  onChangeScheduleVisibility,
  onSubmitSchedule,
  onResetEditing,
}) => {
  const canSubmit =
    !scheduling && !!scheduleTitle && !!scheduleDate && !!scheduleTime;

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)]">
      {/* Lancer maintenant */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-emerald-500" />
            Lancer un direct maintenant
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Démarre une session instantanée avec les membres connectés.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenInstantLaunchModal}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition"
        >
          <span className="text-base leading-none">●</span>
          Lancer un direct
        </button>
      </div>

      {/* Programmer / modifier */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
          <CalendarClock className="w-4 h-4 text-violet-500" />
          {editingId ? "Modifier un direct programmé" : "Programmer un direct"}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Planifie un live à l’avance pour prévenir tes membres.
        </p>

        <div className="space-y-2">
          <input
            type="text"
            value={scheduleTitle}
            onChange={(e) => onChangeScheduleTitle(e.target.value)}
            placeholder="Titre du direct"
            className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 px-2.5 py-1.5"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => onChangeScheduleDate(e.target.value)}
              className="flex-1 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 px-2.5 py-1.5"
            />
            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => onChangeScheduleTime(e.target.value)}
              className="w-32 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 px-2.5 py-1.5"
            />
          </div>

          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-slate-500 dark:text-slate-400">
              Visibilité du direct
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChangeScheduleVisibility(false)}
                className={`px-2 py-1 rounded-full border text-[11px] ${
                  !scheduleIsPublic
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                }`}
              >
                Privé
              </button>
              <button
                type="button"
                onClick={() => onChangeScheduleVisibility(true)}
                className={`px-2 py-1 rounded-full border text-[11px] ${
                  scheduleIsPublic
                    ? "bg-violet-600 text-white border-violet-600"
                    : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                }`}
              >
                Public
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onSubmitSchedule}
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {scheduling
                ? editingId
                  ? "Modification…"
                  : "Programmation…"
                : editingId
                ? "Mettre à jour le direct"
                : "Programmer un direct"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={onResetEditing}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
              >
                Annuler l’édition
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDirectActions;
