import React from "react";

export default function IconBtn({
  children,
  title,
  className,
  onClick,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={[
        "rounded-lg p-1.5 hover:bg-black/5 transition",
        className || "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
