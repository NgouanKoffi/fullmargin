// src/pages/communaute/public/community-details/tabs/about/fields/DescriptionField.tsx
export default function DescriptionField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const MIN_DESCRIPTION_CHARS = 80;
  const len = value.trim().length;
  const ok = len >= MIN_DESCRIPTION_CHARS;

  return (
    <div className="lg:col-span-2">
      <label className="text-sm font-medium text-slate-900 dark:text-slate-200 flex items-center gap-2">
        Description
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          (min. {MIN_DESCRIPTION_CHARS} caractères)
        </span>
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Présente clairement la communauté, sa méthode, ses règles, etc."
        className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-300/20 text-slate-900 dark:text-slate-100"
      />

      <div className="mt-1 flex items-center justify-between">
        {!ok ? (
          <p className="text-xs text-red-500">
            Il manque {MIN_DESCRIPTION_CHARS - len} caractère
            {MIN_DESCRIPTION_CHARS - len > 1 ? "s" : ""}.
          </p>
        ) : (
          <p className="text-xs text-emerald-500">Description suffisante.</p>
        )}
        <p className="text-xs text-slate-400">
          {len}/{MIN_DESCRIPTION_CHARS}
        </p>
      </div>
    </div>
  );
}
