// src/pages/communaute/private/community-details/utils/constants.ts
import type { ReportReason } from "./mapping";

export const REASONS: { key: ReportReason; label: string }[] = [
  { key: "inappropriate", label: "Contenu inapproprié" },
  { key: "harassment", label: "Harcèlement" },
  { key: "spam", label: "Spam" },
  { key: "counterfeit", label: "Contrefaçon" },
  { key: "other", label: "Autre" },
];

export function reasonToLabel(key: ReportReason): string {
  const found = REASONS.find((r) => r.key === key);
  return found ? found.label : "Autre";
}

// alias (certains fichiers attendaient 'reasonLabel')
export const reasonLabel = reasonToLabel;
