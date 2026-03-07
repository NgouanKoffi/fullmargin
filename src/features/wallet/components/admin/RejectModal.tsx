import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { ModalWrapper } from "../../components/SharedWithdrawalModals";

export function RejectModal({
  itemId,
  onClose,
  onConfirm,
}: {
  itemId: string;
  onClose: () => void;
  onConfirm: (id: string, reason: string) => void;
}) {
  const [rejectReason, setRejectReason] = useState("");

  return (
    <ModalWrapper>
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-900/10 shrink-0">
        <h3 className="text-lg font-bold flex items-center gap-2 text-rose-700 dark:text-rose-400">
          <AlertTriangle className="w-5 h-5" /> Rejeter la demande
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6 overflow-y-auto">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Motif du rejet (Envoyé au client)
        </label>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-rose-500/20 min-h-[120px] resize-none"
          placeholder="Ex: L'adresse crypto est invalide..."
        />
      </div>
      <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3 shrink-0">
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
        >
          Annuler
        </button>
        <button
          onClick={() => onConfirm(itemId, rejectReason)}
          disabled={!rejectReason.trim()}
          className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition disabled:opacity-50"
        >
          Rejeter définitivement
        </button>
      </div>
    </ModalWrapper>
  );
}
