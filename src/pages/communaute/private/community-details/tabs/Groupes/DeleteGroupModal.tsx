// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\tabs\Groupes\DeleteGroupModal.tsx
import type { GroupLite } from "../../api/groups.api";

type DeleteModalProps = {
  open: boolean;
  group: GroupLite;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteGroupModal({
  open,
  group,
  busy,
  onCancel,
  onConfirm,
}: DeleteModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center px-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onCancel}
        aria-hidden
      />
      <div className="relative max-w-sm w-full rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200/80 dark:border-slate-700/80 p-5 space-y-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          Supprimer le groupe ?
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Tu es sur le point de supprimer le groupe{" "}
          <span className="font-semibold">« {group.name} »</span>. Cette action
          est réversible côté technique (soft delete), mais le groupe ne sera
          plus visible pour les membres.
        </p>
        <p className="text-xs text-amber-500">
          Les membres ne verront plus ce groupe dans la liste.
        </p>

        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 inline-flex items-center gap-2 disabled:opacity-70"
          >
            {busy && (
              <span className="h-3 w-3 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
            )}
            <span>Supprimer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
