import { useState } from "react";
import { BadgeDollarSign, X } from "lucide-react";
import clsx from "clsx";
import { ModalWrapper } from "../../components/SharedWithdrawalModals";

export function ValidateModal({
  itemId,
  onClose,
  onConfirm,
}: {
  itemId: string;
  onClose: () => void;
  onConfirm: (id: string, ref: string, file: File | null) => void;
}) {
  const [payoutRef, setPayoutRef] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  return (
    <ModalWrapper>
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-900/10 shrink-0">
        <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
          <BadgeDollarSign className="w-5 h-5" /> Valider le paiement
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6 overflow-y-auto space-y-5 flex-1">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Référence transaction (Facultatif)
          </label>
          <input
            value={payoutRef}
            onChange={(e) => setPayoutRef(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder="Ex: TXN-987654321"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Preuve de paiement
          </label>
          <div className="relative group">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div
              className={clsx(
                "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors",
                proofFile
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                  : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 group-hover:border-emerald-400",
              )}
            >
              {proofFile ? (
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {proofFile.name}
                </span>
              ) : (
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Cliquez ou glissez une image / PDF ici
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3 shrink-0">
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
        >
          Annuler
        </button>
        <button
          onClick={() => onConfirm(itemId, payoutRef, proofFile)}
          className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
        >
          Confirmer le paiement
        </button>
      </div>
    </ModalWrapper>
  );
}
