// src/pages/marketplace/tabs/OrdersTab/components/HeaderFilters.tsx
export default function HeaderFilters({
  from,
  to,
  setFrom,
  setTo,
  onReset,
}: {
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  onReset: () => void;
}) {
  const inputCls =
    "w-full text-sm rounded-lg px-2.5 py-2 ring-1 ring-black/10 dark:ring-white/10 bg-transparent " +
    "focus:outline-none focus:ring-2 focus:ring-violet-500/40";

  return (
    <div className="mb-3 min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <h2 className="text-xl font-bold">Mes achats</h2>

        <div className="w-full lg:w-auto min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 items-end">
            <label className="min-w-0">
              <span className="sr-only">Date de début</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="min-w-0">
              <span className="sr-only">Date de fin</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={inputCls}
              />
            </label>

            <button
              onClick={onReset}
              className={
                "w-full text-sm rounded-lg px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 " +
                "hover:bg-neutral-50 dark:hover:bg-neutral-800 " +
                "focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              }
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
