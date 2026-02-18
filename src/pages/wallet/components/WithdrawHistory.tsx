// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\wallet\components\WithdrawHistory.tsx
import { useCallback, useEffect, useState } from "react";
import {
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";
import { money } from "../utils";
import { api } from "../../../lib/api";

export type WithdrawalStatus =
  | "PENDING"
  | "VALIDATED"
  | "PAID"
  | "REJECTED"
  | "FAILED";

interface Withdrawal {
  id: string;
  reference: string;
  date: string;

  // net (affiché)
  amount: number;

  // optionnel (si tu veux afficher plus tard)
  amountGross?: number;
  commission?: number;
  currency?: string;

  method: "USDT" | "BTC" | "BANK";
  details: string;

  status: WithdrawalStatus;

  invoiceUrl?: string | null;

  // utiles pour l'affichage
  payoutRef?: string | null;
  rejectionReason?: string | null;
  failureReason?: string | null;
}

type ApiHistoryResponse =
  | { ok: true; data: Withdrawal[] }
  | { ok: false; error?: string };

type Props = {
  /** Incrémente ce nombre pour forcer un refresh depuis le parent */
  refreshKey?: number;
};

function extractError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (!e || typeof e !== "object") return "Erreur de connexion";

  // axios-like: e.response.data.error
  const obj = e as Record<string, unknown>;
  const resp = obj["response"];
  if (resp && typeof resp === "object") {
    const respObj = resp as Record<string, unknown>;
    const data = respObj["data"];
    if (data && typeof data === "object") {
      const dataObj = data as Record<string, unknown>;
      const err = dataObj["error"];
      if (typeof err === "string") return err;
    }
  }

  const err = obj["error"];
  if (typeof err === "string") return err;

  return "Erreur de connexion";
}

function normalizeHistoryResponse(res: unknown): ApiHistoryResponse | null {
  if (!res || typeof res !== "object") return null;

  // Format A: api.get retourne directement { ok, data }
  const direct = res as Partial<ApiHistoryResponse>;
  if (typeof direct.ok === "boolean") return direct as ApiHistoryResponse;

  // Format B (axios): api.get retourne { data: { ok, data } }
  const maybeAxios = res as { data?: unknown };
  if (maybeAxios.data && typeof maybeAxios.data === "object") {
    const inner = maybeAxios.data as Partial<ApiHistoryResponse>;
    if (typeof inner.ok === "boolean") return inner as ApiHistoryResponse;
  }

  return null;
}

export function WithdrawHistory({ refreshKey = 0 }: Props) {
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(
    async (mode: "initial" | "refresh" = "refresh") => {
      if (mode === "initial") setLoading(true);
      else setRefreshing(true);

      setError(null);

      try {
        const res = (await api.get("/wallet/withdrawals")) as unknown;
        const payload = normalizeHistoryResponse(res);

        if (!payload) {
          setError("Réponse serveur invalide.");
          setHistory([]);
          return;
        }

        if (payload.ok) {
          setHistory(Array.isArray(payload.data) ? payload.data : []);
        } else {
          setError(payload.error || "Erreur lors du chargement des données.");
          setHistory([]);
        }
      } catch (e: unknown) {
        setError(extractError(e));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    let active = true;

    (async () => {
      // évite setState si démonté
      if (!active) return;
      await fetchHistory("initial");
    })();

    return () => {
      active = false;
    };
  }, [fetchHistory]);

  // ✅ Re-fetch quand refreshKey change (ex: après submit retrait)
  useEffect(() => {
    fetchHistory("refresh");
  }, [refreshKey, fetchHistory]);

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <p className="font-medium">
          Impossible de charger l&apos;historique : {error}
        </p>
        <button
          onClick={() => fetchHistory("refresh")}
          className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-white border border-red-200 text-red-700 hover:bg-red-50"
        >
          <RefreshCcw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    );
  }

  const isEmpty = history.length === 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Historique des transactions
        </h2>

        <button
          onClick={() => fetchHistory("refresh")}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          disabled={refreshing}
        >
          <RefreshCcw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Actualiser
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {isEmpty ? (
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
                  <th className="px-6 py-4 font-medium text-right">Facture</th>
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

                      {/* Info complémentaire selon statut */}
                      {item.status === "PAID" && item.payoutRef ? (
                        <div className="text-xs text-emerald-600 mt-1">
                          Tx: {item.payoutRef}
                        </div>
                      ) : null}
                      {item.status === "REJECTED" && item.rejectionReason ? (
                        <div className="text-xs text-red-600 mt-1">
                          Motif: {item.rejectionReason}
                        </div>
                      ) : null}
                      {item.status === "FAILED" && item.failureReason ? (
                        <div className="text-xs text-slate-500 mt-1">
                          Erreur: {item.failureReason}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {money(item.amount)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {item.method}
                        </span>
                        <span
                          className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-[220px]"
                          title={item.details}
                        >
                          {item.details}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-6 py-4 text-right">
                      {item.invoiceUrl ? (
                        <a
                          href={item.invoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 hover:underline"
                          title="Télécharger la facture"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </a>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {refreshing && (
              <div className="px-6 py-4 text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Actualisation…
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: WithdrawalStatus }) {
  if (status === "PAID") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Payé
      </span>
    );
  }

  if (status === "VALIDATED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Validé
      </span>
    );
  }

  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
        <XCircle className="w-3.5 h-3.5" />
        Rejeté
      </span>
    );
  }

  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
        <AlertTriangle className="w-3.5 h-3.5" />
        Échec
      </span>
    );
  }

  // PENDING
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
      <Clock className="w-3.5 h-3.5" />
      En attente
    </span>
  );
}
