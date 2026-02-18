import * as React from "react";

type Props = {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  tone?: "neutral" | "success" | "indigo";
  /** Rendre la carte cliquable (redirige, ouvre un détail, etc.) */
  onClick?: () => void;
};

export default function MiniStat({
  icon,
  title,
  value,
  tone = "neutral",
  onClick,
}: Props) {
  const bg =
    tone === "success"
      ? "bg-emerald-50 dark:bg-emerald-900/15"
      : tone === "indigo"
      ? "bg-indigo-50 dark:bg-indigo-900/15"
      : "bg-neutral-50 dark:bg-neutral-900/20";

  const clickable = onClick
    ? "cursor-pointer hover:ring-2 hover:ring-violet-500/40 transition"
    : "";

  const baseCls = `rounded-2xl border ring-1 ring-black/10 dark:ring-white/10 p-4 text-left w-full ${bg} ${clickable}`;

  const Content = () => (
    <>
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-600 dark:text-neutral-300">
          {title}
        </div>
        <div className="opacity-70">{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
    </>
  );

  // Rendu sémantique: <button> si cliquable, sinon <div>
  if (onClick) {
    return (
      <button
        type="button"
        className={baseCls}
        onClick={onClick}
        title="Voir le détail"
      >
        <Content />
      </button>
    );
  }

  return (
    <div className={baseCls}>
      <Content />
    </div>
  );
}
