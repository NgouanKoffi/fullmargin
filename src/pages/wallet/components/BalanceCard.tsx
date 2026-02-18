// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\wallet\components\BalanceCard.tsx
import clsx from "clsx";
import { money } from "../utils"; // On importe notre utilitaire

interface BalanceCardProps {
  title: string;
  icon: React.ReactNode;
  amount: number;
  currency: string;
  emphasis?: boolean;
  loading?: boolean;
}

export function BalanceCard({
  title,
  icon,
  amount,
  currency,
  emphasis = false,
  loading = false,
}: BalanceCardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl p-5 border flex flex-col justify-between h-full bg-white dark:bg-slate-900 shadow-sm",
        emphasis
          ? "border-violet-200 dark:border-violet-500/30 bg-violet-50/30 dark:bg-violet-900/10"
          : "border-slate-200 dark:border-slate-800",
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          className={clsx(
            "inline-flex items-center justify-center w-10 h-10 rounded-xl",
            emphasis
              ? "bg-violet-600 text-white shadow-md shadow-violet-200 dark:shadow-none"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
          )}
        >
          {icon}
        </span>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </div>
      </div>

      <div className="">
        {loading ? (
          <div className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
        ) : (
          <div
            className={clsx(
              "font-bold truncate tracking-tight",
              emphasis
                ? "text-3xl text-violet-700 dark:text-violet-300"
                : "text-2xl text-slate-900 dark:text-white",
            )}
          >
            {money(amount, currency)}
          </div>
        )}
      </div>
    </div>
  );
}
