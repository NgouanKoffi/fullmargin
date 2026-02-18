import { inputBase } from "../constants";
import { useId } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  placeholder?: string;
  required?: boolean;
  minHeightClass?: string;
};

export default function TextAreaWithCount({
  label,
  value,
  onChange,
  max,
  placeholder,
  required = false,
  minHeightClass = "min-h-[140px]",
}: Props) {
  const id = useId();
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {value.length}/{max}
        </span>
      </div>
      <textarea
        id={id}
        className={`${inputBase} ${minHeightClass} resize-vertical`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
        maxLength={max}
        required={required}
      />
    </div>
  );
}
