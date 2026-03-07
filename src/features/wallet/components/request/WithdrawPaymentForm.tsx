import clsx from "clsx";
import { CreditCard, Bitcoin, Building2, Loader2, ArrowRight } from "lucide-react";
import { MethodButton } from "../common/MethodButton";

type Props = {
  method: "USDT" | "BTC" | "BANK" | "";
  setMethod: (m: "USDT" | "BTC" | "BANK" | "") => void;
  formData: {
    cryptoAddress: string;
    bankName: string;
    bankIban: string;
    bankSwift: string;
    bankCountry: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  canWithdraw: boolean;
  submitting: boolean;
  submitSuccess: boolean;
  onSubmit: () => void;
};

export function WithdrawPaymentForm({
  method,
  setMethod,
  formData,
  handleChange,
  canWithdraw,
  submitting,
  submitSuccess,
  onSubmit,
}: Props) {
  return (
    <div
      className={clsx(
        "rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 p-6 sm:p-8 shadow-sm",
        (!canWithdraw || submitSuccess) && "opacity-50 pointer-events-none"
      )}
    >
      <div className="flex items-center gap-3 mb-8">
        <CreditCard className="w-6 h-6 text-violet-600" />
        <h2 className="font-semibold text-xl">Méthode de paiement</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <MethodButton
          active={method === "USDT"}
          onClick={() => setMethod("USDT")}
          icon={<Bitcoin className="w-6 h-6" />}
          label="USDT (TRC20)"
          sub="Recommandé"
        />
        <MethodButton
          active={method === "BTC"}
          onClick={() => setMethod("BTC")}
          icon={<Bitcoin className="w-6 h-6" />}
          label="Bitcoin"
          sub="Volatile"
        />
        <MethodButton
          active={method === "BANK"}
          onClick={() => setMethod("BANK")}
          icon={<Building2 className="w-6 h-6" />}
          label="Virement"
          sub="2-5 jours"
        />
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 mb-8 min-h-[120px]">
        {!method && (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm py-4">
            Sélectionnez une méthode pour continuer.
          </div>
        )}
        {(method === "USDT" || method === "BTC") && (
          <div className="animate-in fade-in duration-300">
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
              Adresse {method === "USDT" ? "TRC20" : "Bitcoin"}
            </label>
            <input
              type="text"
              name="cryptoAddress"
              value={formData.cryptoAddress}
              onChange={handleChange}
              placeholder={method === "USDT" ? "Ex: T9yD14Nj9..." : "Ex: 1A1zP1eP..."}
              className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
        )}
        {method === "BANK" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                  placeholder="Nom Prénom"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                  Pays
                </label>
                <input
                  type="text"
                  name="bankCountry"
                  value={formData.bankCountry}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                  placeholder="Ex: France"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                IBAN / RIB
              </label>
              <input
                type="text"
                name="bankIban"
                value={formData.bankIban}
                onChange={handleChange}
                className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                placeholder="FR76..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                Code SWIFT (Optionnel)
              </label>
              <input
                type="text"
                name="bankSwift"
                value={formData.bankSwift}
                onChange={handleChange}
                className="w-full sm:w-1/2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                placeholder="Ex: BNPFR..."
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSubmit}
          disabled={!canWithdraw || !method || submitting}
          className={clsx(
            "inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold transition-all shadow-md",
            !canWithdraw || !method || submitting
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-violet-600 text-white hover:bg-violet-700 hover:-translate-y-0.5"
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Traitement...
            </>
          ) : (
            <>
              <ArrowRight className="w-5 h-5" /> Soumettre la demande
            </>
          )}
        </button>
      </div>
    </div>
  );
}
