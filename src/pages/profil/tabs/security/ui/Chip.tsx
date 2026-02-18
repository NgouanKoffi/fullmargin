import React from "react";
import cx from "../../../utils/cx";

export default function Chip({
  tone,
  children,
}: {
  tone: "green" | "amber" | "slate" | "primary";
  children: React.ReactNode;
}) {
  const map =
    tone === "green"
      ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25"
      : tone === "amber"
      ? "bg-amber-500/12 text-amber-700 ring-amber-500/25"
      : tone === "primary"
      ? "bg-fm-primary/12 text-fm-primary ring-fm-primary/25"
      : "bg-slate-500/12 text-slate-700 ring-slate-500/20";

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1",
        map
      )}
    >
      {children}
    </span>
  );
}
