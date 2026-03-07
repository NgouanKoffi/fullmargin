export default function DataBar({
  items,
}: {
  items: Array<{ label: string; value: string | number; hint?: string }>;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((it, idx) => (
        <div
          key={idx}
          className="rounded-xl px-3 py-3 ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60"
        >
          <div className="text-[11px] uppercase tracking-wide opacity-60 whitespace-nowrap truncate">
            {it.label}
          </div>
          <div className="text-xl font-extrabold whitespace-nowrap truncate">
            {it.value}
          </div>
          {it.hint && (
            <div className="text-[11px] opacity-60 whitespace-nowrap truncate">
              {it.hint}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
