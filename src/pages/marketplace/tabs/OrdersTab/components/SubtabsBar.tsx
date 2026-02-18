// src/pages/marketplace/tabs/OrdersTab/components/SubtabsBar.tsx
import type { Subtab } from "../types";

export default function SubtabsBar({
  subtab,
  setSubtab,
}: {
  subtab: Subtab;
  setSubtab: (v: Subtab) => void;
}) {
  const base =
    "w-full min-h-[44px] px-3 py-2 rounded-full text-[13px] sm:text-sm ring-1 ring-black/10 dark:ring-white/10 " +
    "flex items-center justify-center text-center leading-tight " +
    "focus:outline-none focus:ring-2 focus:ring-violet-500/40";

  const btn = (key: Subtab, label: string) => (
    <button
      key={key}
      onClick={() => setSubtab(key)}
      className={`${base} ${
        subtab === key
          ? "bg-violet-600 text-white"
          : "bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-stretch min-w-0">
      {btn("orders", "Reçus de paiement")}
      {btn("downloads", "Produits")}
      {/* {btn("subscriptions", "Abonnements")} */}
    </div>
  );
}
