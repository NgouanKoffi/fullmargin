import type React from "react";
import { Check } from "lucide-react";

export function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 items-start">
      <Check className="w-4 h-4 mt-0.5 text-indigo-400 dark:text-indigo-300 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

export function ProFeature({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-2 items-start">
      <Icon className="w-4 h-4 mt-0.5 text-indigo-300 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
