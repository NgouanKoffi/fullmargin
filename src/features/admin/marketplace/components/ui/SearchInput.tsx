import { Search } from "lucide-react";

export default function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Rechercher…"}
        className="pl-9 pr-3 py-1.5 rounded-lg ring-1 ring-black/10 dark:ring-white/10 bg-white/80 dark:bg-neutral-900/70 text-sm"
      />
      <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 opacity-60" />
    </div>
  );
}
