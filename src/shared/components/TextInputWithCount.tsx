import { useId } from "react";

const inputBase =
  "w-full rounded-xl border px-4 py-3 " +
  "bg-white text-neutral-900 placeholder-neutral-500 border-neutral-300 " +
  "focus:outline-none focus:ring-2 focus:ring-violet-500/60 " +
  "dark:bg-neutral-900/60 dark:text-neutral-100 dark:placeholder-neutral-400 dark:border-white/10 transition-all";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  placeholder?: string;
  required?: boolean;
  type?: string;
};

export default function TextInputWithCount({
  label,
  value,
  onChange,
  max,
  placeholder,
  required = false,
  type = "text",
}: Props) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-3 px-1">
        <label htmlFor={id} className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          {value.length} / {max}
        </span>
      </div>
      <input
        id={id}
        type={type}
        className={inputBase}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
        maxLength={max}
        required={required}
      />
    </div>
  );
}
