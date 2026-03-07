import React from "react";

export default function SectionTitle({
  icon,
  title,
  right,
}: {
  icon?: React.ReactNode;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-skin-base font-semibold">{title}</h3>
      </div>
      {right}
    </div>
  );
}
