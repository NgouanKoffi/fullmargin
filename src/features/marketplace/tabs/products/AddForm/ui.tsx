import React from "react";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 p-4">
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold">{title}</h3>
      {subtitle ? <p className="text-sm opacity-70">{subtitle}</p> : null}
    </div>
  );
}

export function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-medium">
      {children} {required ? <span className="text-red-500">*</span> : null}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "mt-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/60 " +
        (props.className ?? "")
      }
    />
  );
}

export function InputNumber({
  value,
  onChange,
  ...rest
}: {
  value: number;
  onChange: (n: number) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      {...rest}
      className={
        "mt-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/60 " +
        (rest.className ?? "")
      }
    />
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={
        "mt-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/60 " +
        (props.className ?? "")
      }
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        "mt-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/60 " +
        (className ?? "")
      }
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function DropZone({
  icon,
  text,
  children,
}: {
  icon: React.ReactNode;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-xl ring-1 ring-dashed ring-black/15 dark:ring-white/15 bg-white/50 dark:bg-neutral-900/40 px-4 py-6 text-sm flex items-center gap-3 justify-center hover:bg-white/70 dark:hover:bg-neutral-900/60 transition-colors">
      <div className="shrink-0">{icon}</div>
      <div>{text}</div>
      {children}
    </div>
  );
}

export function SegBtn({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors " +
        (active
          ? "bg-violet-600 text-white"
          : "text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5")
      }
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

export function ErrorLine({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) {
  if (!text) return null;
  return (
    <p className={`text-xs text-red-600 mt-1 ${className ?? ""}`}>{text}</p>
  );
}

export function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 opacity-70">
        {icon}
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
