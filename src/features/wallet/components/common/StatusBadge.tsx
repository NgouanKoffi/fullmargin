import clsx from "clsx";

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    VALIDATED: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
    PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
    FAILED: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  };
  
  return (
    <span
      className={clsx(
        "px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider",
        styles[status] || styles.FAILED,
      )}
    >
      {status}
    </span>
  );
}
