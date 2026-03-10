// src/pages/wallet/components/WithdrawHistory.tsx
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "../common/StatusBadge";
import { DetailsModal } from "../common/DetailsModal";
import type { UnifiedWithdrawal } from "../common/types";
import { money } from "@features/wallet/utils";
import { api } from "@core/api/client";
import { Bitcoin, Building2, Clock, Download, Eye, Loader2, RefreshCcw } from "lucide-react";

interface Withdrawal {
  id: string;
  reference: string;
  date: string;
  amount: number;
  method: "USDT" | "BTC" | "BANK";
  details: string;
  paymentDetails?: any;
  status: any;
  invoiceUrl?: string | null;
  payoutRef?: string | null;
  rejectionReason?: string | null;
  failureReason?: string | null;
  proof?: string | null;
}

export function WithdrawHistory({ refreshKey = 0 }: { refreshKey?: number }) {
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewingItem, setViewingItem] = useState<Withdrawal | null>(null);

  const fetchHistory = useCallback(
    async (mode: "initial" | "refresh" = "refresh") => {
      if (mode === "initial") setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const res: any = await api.get("/wallet/withdrawals");
        let data = res;
        if (res && res.data && typeof res.data.ok === "boolean")
          data = res.data;

        if (data && data.ok) {
          setHistory(Array.isArray(data.data) ? data.data : []);
        } else {
          setError(data?.error || "Erreur serveur");
        }
      } catch (e: any) {
        setError(e.message || "Erreur de connexion");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchHistory("initial");
  }, [fetchHistory]);
  useEffect(() => {
    fetchHistory("refresh");
  }, [refreshKey, fetchHistory]);

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  if (error)
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <p>Impossible de charger l'historique : {error}</p>
        <button
          onClick={() => fetchHistory("refresh")}
          className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-white border border-red-200 text-red-700"
        >
          <RefreshCcw className="w-4 h-4" /> Réessayer
        </button>
      </div>
    );

  const unifiedViewingItem: UnifiedWithdrawal | null = viewingItem
    ? {
        id: viewingItem.id,
        reference: viewingItem.reference,
        date: viewingItem.date,
        amountNet: viewingItem.amount,
        method: viewingItem.method,
        status: viewingItem.status,
        paymentDetails: viewingItem.paymentDetails,
        details: viewingItem.details,
        rejectionReason: viewingItem.rejectionReason,
        failureReason: viewingItem.failureReason,
        payoutRef: viewingItem.payoutRef,
        proof: viewingItem.proof,
      }
    : null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Historique des transactions
        </h2>
        <button
          onClick={() => fetchHistory("refresh")}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          disabled={refreshing}
        >
          <RefreshCcw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />{" "}
          Actualiser
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {history.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Aucune demande de retrait effectuée pour le moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Date / Réf</th>
                  <th className="px-6 py-4 font-medium">Montant Net</th>
                  <th className="px-6 py-4 font-medium">Méthode</th>
                  <th className="px-6 py-4 font-medium">Statut</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {new Date(item.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        #{item.reference}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {money(item.amount)}
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
                          onClick={() => setViewingItem(item)}
                          className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {item.invoiceUrl && (
                          <a
                            href={item.invoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-500/20 transition"
                            title="Télécharger la facture"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {unifiedViewingItem && (
        <DetailsModal
          item={unifiedViewingItem}
          onClose={() => setViewingItem(null)}
        />
      )}
    </div>
  );
}
