// src/pages/communaute/public/community-details/components/DrawerItem.tsx
import React from "react";

export default function DrawerItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-[15px]
      ${
        active
          ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
          : "hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
