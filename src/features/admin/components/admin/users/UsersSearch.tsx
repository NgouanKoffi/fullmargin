type Props = { value: string; onChange: (v: string) => void };

export default function UsersSearch({ value, onChange }: Props) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Rechercher nom ou email…"
      className="w-full sm:w-80 h-9 rounded-xl px-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
    />
  );
}