import { Building2, Bitcoin, Eye, CheckCircle2, XCircle } from "lucide-react";
import { StatusBadge } from "../../components/SharedWithdrawalModals";
import type { WItem } from "./types";

type Props = {
  items: WItem[];
  loading: boolean;
  onViewItem: (item: WItem) => void;
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
};

export function WithdrawalsTable({
  items,
  loading,
  onViewItem,
  onValidate,
  onReject,
}: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4">Réf</th>
              <th className="px-6 py-4">Utilisateur</th>
              <th className="px-6 py-4">Net</th>
              <th className="px-6 py-4">Méthode</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                  {item.reference}
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold">{item.user?.name}</div>
                  <div className="text-xs text-slate-500">
                    {item.user?.email}
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-violet-600 dark:text-violet-400">
                  {item.amountNet.toFixed(2)} $
                </td>
                <td className="px-6 py-4 font-medium">
                  <span className="flex items-center gap-1.5">
                    {item.method === "BANK" ? (
                      <Building2 className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Bitcoin className="w-4 h-4 text-amber-500" />
                    )}
                    {item.method}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onViewItem(item)}
                      className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {item.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => onValidate(item.id)}
                          className="p-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition"
                          title="Valider & Payer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onReject(item.id)}
                          className="p-2 bg-rose-100 text-rose-700 rounded-xl hover:bg-rose-200 transition"
                          title="Rejeter"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  Aucun retrait trouvé dans cette catégorie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
