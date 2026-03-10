// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\finance\ChartsTab\ChartCard.tsx
export default function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-4 shadow-sm
                      ring-1 ring-slate-200/70 dark:ring-slate-700/50
                      bg-slate-50 dark:bg-slate-800/60"
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {subtitle && (
          <div className="text-[12px] text-slate-500 mt-0.5">{subtitle}</div>
        )}
      </div>
      <div className="h-[260px] sm:h-[320px]">{children}</div>
    </div>
  );
}
