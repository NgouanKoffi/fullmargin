import { CheckCircle2, XCircle, AlertTriangle, Info, Bitcoin, Building2, Copy, X, ExternalLink } from "lucide-react";
import { money } from "../../utils";
import { StatusBadge } from "./StatusBadge";
import { ModalWrapper } from "./ModalWrapper";
import type { UnifiedWithdrawal } from "./types";

export function DetailsModal({
  item,
  onClose,
}: {
  item: UnifiedWithdrawal;
  onClose: () => void;
}) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copié dans le presse-papier !");
  };

  return (
    <ModalWrapper>
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <Info className="w-5 h-5 text-violet-600" /> Détails de la transaction
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto space-y-6 flex-1">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl space-y-3 text-sm border border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700/50">
            <span className="text-slate-500 font-medium">Référence</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              #{item.reference}
            </span>
          </div>
          {item.user && (
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700/50">
              <span className="text-slate-500 font-medium">Utilisateur</span>
              <div className="text-right font-bold text-slate-800 dark:text-slate-100">
                {item.user.name}
                <div className="text-xs text-slate-500 font-normal">
                  {item.user.email}
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700/50">
            <span className="text-slate-500 font-medium">Date</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {new Date(item.date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700/50">
            <span className="text-slate-500 font-medium">Montant Net</span>
            <span className="font-black text-lg text-violet-600 dark:text-violet-400">
              {money(item.amountNet)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Statut</span>
            <StatusBadge status={item.status} />
          </div>
        </div>

        {item.status === "REJECTED" && item.rejectionReason && (
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-400">
            <h4 className="font-bold flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4" /> Motif du rejet
            </h4>
            <p className="text-sm">{item.rejectionReason}</p>
          </div>
        )}
        {item.status === "FAILED" && item.failureReason && (
          <div className="p-4 rounded-xl border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <h4 className="font-bold flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4" /> Erreur rencontrée
            </h4>
            <p className="text-sm">{item.failureReason}</p>
          </div>
        )}

        {item.status === "PAID" && (item.payoutRef || item.proof) && (
          <div className="p-5 rounded-2xl border border-emerald-200/60 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-900/10 space-y-4">
            <h4 className="font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
              <CheckCircle2 className="w-5 h-5" /> Paiement Effectué
            </h4>
            {item.payoutRef && (
              <div>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 block">
                  Réf. de transaction
                </span>
                <span className="font-mono font-medium text-emerald-800 dark:text-emerald-300">
                  {item.payoutRef}
                </span>
              </div>
            )}
            {item.proof && (
              <a
                href={item.proof}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                <ExternalLink className="w-4 h-4" /> Voir la preuve de paiement
              </a>
            )}
          </div>
        )}

        {(item.method === "USDT" || item.method === "BTC") && (
          <div className="p-5 rounded-2xl border border-amber-200/60 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10 space-y-4">
            <h4 className="font-bold flex items-center gap-2 text-amber-700 dark:text-amber-500">
              <Bitcoin className="w-5 h-5" /> Réseau Crypto : {item.method}
            </h4>
            <div>
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1.5 block">
                Adresse de réception
              </span>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 break-all text-sm font-mono shadow-sm">
                  {item.paymentDetails?.cryptoAddress ||
                    item.details ||
                    "Non renseignée"}
                </code>
                <button
                  onClick={() =>
                    handleCopy(
                      item.paymentDetails?.cryptoAddress || item.details || "",
                    )
                  }
                  className="p-3 bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:hover:bg-violet-500/30 rounded-xl transition shrink-0"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {item.method === "BANK" && (
          <div className="p-5 rounded-2xl border border-blue-200/60 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/10 space-y-4">
            <h4 className="font-bold flex items-center gap-2 text-blue-700 dark:text-blue-500 mb-2">
              <Building2 className="w-5 h-5" /> Virement Bancaire
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="col-span-1 sm:col-span-2">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1.5 block">
                  Nom de la banque
                </span>
                <div className="font-semibold bg-white dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  {item.paymentDetails?.bankName || "N/A"}
                </div>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1.5 block">
                  IBAN / Numéro de compte
                </span>
                <div className="flex gap-2">
                  <div className="flex-1 font-mono font-semibold bg-white dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm break-all">
                    {item.paymentDetails?.bankIban || item.details || "N/A"}
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(
                        item.paymentDetails?.bankIban || item.details || "",
                      )
                    }
                    className="p-2.5 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30 rounded-xl shrink-0"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1.5 block">
                  Code SWIFT/BIC
                </span>
                <div className="font-mono bg-white dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  {item.paymentDetails?.bankSwift || "N/A"}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1.5 block">
                  Pays
                </span>
                <div className="font-semibold bg-white dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  {item.paymentDetails?.bankCountry || "N/A"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end shrink-0">
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold rounded-xl transition shadow-sm"
        >
          Fermer
        </button>
      </div>
    </ModalWrapper>
  );
}
