import React from "react";
import cx from "../../../utils/cx";

export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-xl border border-skin-border/50 ring-1 ring-skin-border/25",
        "bg-white dark:bg-slate-900 shadow-sm p-5",
        className
      )}
    >
      {children}
    </div>
  );
}
