// src/pages/journal/tabs/view/ui.tsx
export function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}

export function ChartOrEmpty({
  hasData,
  children,
}: {
  hasData: boolean;
  children: React.ReactNode;
}) {
  if (hasData) return <>{children}</>;
  return (
    <div className="h-64 grid place-items-center text-slate-500 text-sm">
      Aucune donnée pour la période / filtres sélectionnés.
    </div>
  );
}
