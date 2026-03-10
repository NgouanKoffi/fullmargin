// src/pages/journal/tabs/accounts/GlobalCurrencyBar.tsx

import { CURRENCIES, type Currency } from "../../types";

export default function GlobalCurrencyBar({
  globalCurrency,
  setGlobalCurrency,
  applyGlobalCurrency,
  busyGlobal,
}: {
  globalCurrency: Currency;
  setGlobalCurrency: (c: Currency) => void;
  applyGlobalCurrency: (c: Currency) => void;
  busyGlobal: boolean;
}) {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-3">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 mb-2">
        Devise globale
      </p>
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={globalCurrency}
          onChange={(e) => setGlobalCurrency(e.target.value as Currency)}
          className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm flex-1 min-w-[180px]"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => applyGlobalCurrency(globalCurrency)}
          disabled={busyGlobal}
          className="inline-flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white px-5 py-2 text-sm transition flex-none"
        >
          {busyGlobal ? "Application..." : "Appliquer à tous"}
        </button>
      </div>
    </div>
  );
}
