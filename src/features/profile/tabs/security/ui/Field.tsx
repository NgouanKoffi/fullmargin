import React from "react";

export default function Field({
  type,
  placeholder,
  value,
  onChange,
  right,
}: {
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 ring-1 ring-skin-border/30 p-3 pr-10 text-sm outline-none focus:ring-fm-primary/35"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {right ? (
        <div className="absolute inset-y-0 right-2 grid place-items-center">
          {right}
        </div>
      ) : null}
    </div>
  );
}
