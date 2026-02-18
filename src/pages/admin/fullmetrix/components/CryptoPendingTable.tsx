// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\fullmetrix\components\CryptoPendingTable.tsx
import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  X,
  Copy,
  Smartphone,
  AlertTriangle,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  notifySuccess,
  notifyError,
} from "../../../../components/Notification";
import { api } from "../../../../lib/api";
import type { FmMetrixAdminItem } from "../types";

type Props = {
  items: FmMetrixAdminItem[];
  onRefresh: () => void;
};

// --- COMPOSANT MODAL INTERNE ---
type ConfirmModalProps = {
  type: "approve" | "reject";
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
};

function ConfirmModal({
  type,
  onClose,
  onConfirm,
  loading,
}: ConfirmModalProps) {
  if (typeof document === "undefined") return null;

  const isApprove = type === "approve";
  const title = isApprove ? "Valider le paiement" : "Rejeter la demande";
  const desc = isApprove
    ? "As-tu bien vérifié la réception des fonds sur WhatsApp ? L'abonnement sera activé immédiatement."
    : "Es-tu sûr de vouloir supprimer cette demande ? L'utilisateur devra recommencer la procédure.";

  const Icon = isApprove ? ShieldCheck : AlertTriangle;
  const colorClass = isApprove
    ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400"
    : "text-red-600 bg-red-100 dark:bg-red-500/20 dark:text-red-400";
  const btnClass = isApprove
    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
    : "bg-red-500 hover:bg-red-600 text-white";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-700">
        <div className="flex flex-col items-center text-center gap-4">
          <div className={`p-3 rounded-full ${colorClass}`}>
            <Icon className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {desc}
            </p>
          </div>

          <div className="flex gap-3 w-full mt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold shadow-md transition disabled:opacity-70 flex items-center justify-center gap-2 ${btnClass}`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isApprove ? "Oui, valider" : "Oui, supprimer"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// --- TABLEAU PRINCIPAL ---
export default function CryptoPendingTable({ items, onRefresh }: Props) {
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject";
    id: string;
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    notifySuccess("Référence copiée !");
  };

  const requestAction = (type: "approve" | "reject", id: string) => {
    setConfirmAction({ type, id });
  };

  const executeAction = async () => {
    if (!confirmAction) return;

    setProcessing(true);
    try {
      if (confirmAction.type === "approve") {
        await api.post("/payments/admin/fm-metrix/crypto/approve", {
          subscriptionId: confirmAction.id,
        });
        notifySuccess("Paiement validé et abonnement activé !");
      } else {
        await api.post("/payments/admin/fm-metrix/crypto/reject", {
          subscriptionId: confirmAction.id,
        });
        notifySuccess("Demande supprimée.");
      }
      onRefresh();
      setConfirmAction(null);
    } catch (e) {
      console.error(e);
      notifyError("Une erreur est survenue.");
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed text-slate-500 dark:text-slate-400">
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-full mb-3">
          <Smartphone className="w-6 h-6 text-slate-400 dark:text-slate-500" />
        </div>
        <p>Aucune demande de paiement crypto en attente.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        {/* Wrapper Scroll Horizontal */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Utilisateur</th>
                <th className="px-6 py-4 font-medium">Référence (WhatsApp)</th>
                <th className="px-6 py-4 font-medium">Montant</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition group"
                >
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    <div className="font-medium text-slate-700 dark:text-slate-300">
                      {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(item.createdAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {item.userName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {item.userEmail}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      onClick={() => handleCopy(item.cryptoRef || "")}
                      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-500/20 hover:border-amber-300 transition select-all"
                      title="Cliquer pour copier"
                    >
                      <span className="font-mono text-xs font-bold tracking-wide">
                        {item.cryptoRef}
                      </span>
                      <Copy className="w-3 h-3 opacity-50" />
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-slate-200">
                        {item.amount} USDT
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded w-fit mt-1">
                        {item.network}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2 opacity-100 sm:opacity-90 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => requestAction("reject", item.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400 border border-transparent hover:border-red-100 dark:hover:border-red-800 transition"
                        title="Rejeter la demande"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => requestAction("approve", item.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20 active:scale-[0.98] transition"
                      >
                        <Check className="w-4 h-4" />
                        <span className="text-xs font-bold">Valider</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmAction && (
        <ConfirmModal
          type={confirmAction.type}
          loading={processing}
          onClose={() => setConfirmAction(null)}
          onConfirm={executeAction}
        />
      )}
    </>
  );
}
