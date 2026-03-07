import { Calculator } from "lucide-react";
import { money } from "../../utils";

type Props = {
  total: number;
  currency: string;
  taxableAmount: number;
  fees: number;
  affiliation: number;
  net: number;
};

export function WithdrawCalculation({
  total,
  currency,
  taxableAmount,
  fees,
  affiliation,
  net,
}: Props) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 p-6 sticky top-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6 text-violet-600">
        <Calculator className="w-5 h-5" />
        <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
          Détails du calcul
        </h2>
      </div>
      <div className="space-y-4 text-sm">
        <div className="flex justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-500">Solde Total</span>
          <span className="font-bold">{money(total, currency)}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500">Ventes (Boutique + Commu)</span>
          <span>{money(taxableAmount, currency)}</span>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-500">Frais de service (9%)</span>
          <span className="text-red-500">- {money(fees, currency)}</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500 text-xs">
            Affiliation{" "}
            <span className="bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded text-[10px] ml-1">
              0% Frais
            </span>
          </span>
          <span className="text-emerald-600">
            + {money(affiliation, currency)}
          </span>
        </div>
        <div className="flex justify-between pt-4 border-t border-dashed border-slate-200">
          <span className="font-bold text-lg">Net à recevoir</span>
          <span className="font-bold text-xl text-violet-600">
            {money(net, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
