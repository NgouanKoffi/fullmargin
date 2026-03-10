// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\fullmetrix\UserHistoryModal.tsx
import { createPortal } from "react-dom";
import { X, Calendar, CreditCard, ShieldCheck, XCircle } from "lucide-react";
import type { FmMetrixAdminItem } from "./types";

type Props = {
  userEmail: string;
  userName: string;
  history: FmMetrixAdminItem[];
  onClose: () => void;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function UserHistoryModalInner({
  userEmail,
  userName,
  history,
  onClose,
}: Props) {
  // On trie l'historique du plus récent au plus ancien
  const sortedHistory = [...history].sort((a, b) => {
    return (
      new Date(b.periodEnd || 0).getTime() -
      new Date(a.periodEnd || 0).getTime()
    );
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Historique des abonnements
            </h2>
            <div className="flex flex-col mt-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {userName}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {userEmail}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable list */}
        <div className="overflow-y-auto p-0 flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 font-medium sticky top-0 backdrop-blur-md">
              <tr>
                <th className="px-6 py-3">Période</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3 text-right">Créé le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {sortedHistory.map((item) => {
                const isExpired =
                  item.status === "expired" ||
                  (item.periodEnd && new Date(item.periodEnd) < new Date());

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <div className="flex flex-col text-xs font-medium">
                          <span>Du {formatDate(item.periodStart)}</span>
                          <span
                            className={
                              isExpired
                                ? "text-slate-500"
                                : "text-emerald-600 dark:text-emerald-400 font-bold"
                            }
                          >
                            Au {formatDate(item.periodEnd)}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        <span className="uppercase text-[10px] font-bold tracking-wide text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          {item.provider.replace("manual_", "")}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {isExpired ? (
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                          <XCircle className="w-3.5 h-3.5" />
                          Expiré
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Actif
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right text-xs text-slate-400">
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function UserHistoryModal(props: Props) {
  if (typeof document === "undefined") return null;
  const target = document.getElementById("root") ?? document.body;
  return createPortal(<UserHistoryModalInner {...props} />, target);
}
