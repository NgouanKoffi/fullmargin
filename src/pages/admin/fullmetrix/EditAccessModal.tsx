// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\fullmetrix\EditAccessModal.tsx
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../../lib/api";
import { notifyError, notifySuccess } from "../../../components/Notification";

// On utilise un type compatible avec ce qu'on reçoit du backend
type Props = {
  item: {
    userId: string;
    userName: string;
    userEmail: string | null;
    periodEnd: string | null;
    provider: string;
  };
  onClose: () => void;
  onSaved: () => void;
};

function formatDate(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

function EditAccessModalInner({ item, onClose, onSaved }: Props) {
  const [months, setMonths] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const currentEndLabel = useMemo(
    () => formatDate(item.periodEnd),
    [item.periodEnd],
  );

  async function submit() {
    if (months <= 0) {
      notifyError("La durée doit être d’au moins 1 mois.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/payments/admin/fm-metrix/grant", {
        userId: item.userId,
        months,
      });

      notifySuccess("Abonnement mis à jour.");
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
      notifyError("Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
      <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-6 rounded-2xl w-full max-w-md shadow-2xl border border-transparent dark:border-slate-700">
        <h2 className="text-xl font-semibold mb-4">Modifier l’abonnement</h2>

        <div className="space-y-2 mb-4 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
          <div className="font-medium text-slate-900 dark:text-slate-100">
            {item.userName}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {item.userEmail}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Fin actuelle :{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {currentEndLabel}
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Ajouter des mois
          </label>
          <select
            className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i + 1}>
                {i + 1} mois
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Prolonge l'abonnement de la durée choisie à partir d'aujourd'hui.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 text-sm bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditAccessModal(props: Props) {
  if (typeof document === "undefined") return null;
  const target = document.getElementById("root") ?? document.body;
  return createPortal(<EditAccessModalInner {...props} />, target);
}
