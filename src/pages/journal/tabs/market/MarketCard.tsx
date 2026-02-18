// src/pages/journal/tabs/market/MarketCard.tsx
import { ChevronRight, Pencil, Trash2, CandlestickChart } from "lucide-react";
import type { Currency } from "../../types";
import type { MarketStats } from "./stats";
import { fmtMoney } from "../../utils";

type Market = { id: string; name: string; createdAt: string };

export default function MarketCard({
  market,
  stats,
  currency,
  onShowDetails,
  onEdit,
  onAskDelete,
}: {
  market: Market;
  stats?: MarketStats;
  currency: Currency;
  onShowDetails: () => void;
  onEdit: () => void;
  onAskDelete: () => void;
}) {
  const st: MarketStats = stats || {
    trades: 0,
    wins: 0,
    breakeven: 0,
    invested: 0,
    gain: 0,
    loss: 0,
    net: 0,
    dd: 0,
    series: [],
  };

  return (
    <article className="group rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm overflow-hidden hover:shadow-md transition">
      {/* on autorise le wrap global */}
      <header className="flex flex-wrap gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
        {/* bloc gauche : ne pas trop rétrécir */}
        <div className="flex items-center gap-3 flex-1 min-w-[160px] shrink-0">
          <button
            onClick={onShowDetails}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Voir le détail"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-10 w-10 rounded-xl grid place-items-center bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-sm">
            <CandlestickChart className="w-5 h-5" />
          </div>

          {/* le nom peut passer sur 2 lignes */}
          <div className="min-w-0">
            <h4 className="font-semibold leading-tight break-words">
              {market.name}
            </h4>
          </div>
        </div>

        {/* bloc actions : c’est lui qui descend quand ça serre */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
          {/* badges visibles même en mobile */}
          <div className="flex items-center gap-2 mr-1">
            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100">
              {st.trades} trades
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ${
                st.net >= 0
                  ? "ring-emerald-200/60 dark:ring-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300"
                  : "ring-rose-200/60 dark:ring-rose-800/50 bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-300"
              }`}
              title="P&L net"
            >
              {fmtMoney(st.net, currency)}
            </span>
          </div>

          <button
            onClick={onEdit}
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg ring-1 ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onAskDelete}
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg ring-1 ring-rose-200 dark:ring-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>
    </article>
  );
}
