// src/pages/marketplace/public/ProductPreview/components/StatusChip.tsx

import type { PublicProductFull } from "../../lib/publicShopApi";

export default function StatusChip({
  status,
}: {
  status?: PublicProductFull["status"];
}) {
  if (!status || status === "published") return null;

  const label =
    status === "pending"
      ? "en attente"
      : status === "rejected"
      ? "refusé"
      : status === "suspended"
      ? "suspendu"
      : "brouillon";

  const cls =
    status === "pending"
      ? "bg-amber-500/90 text-white"
      : status === "rejected"
      ? "bg-rose-600/90 text-white"
      : status === "suspended"
      ? "bg-neutral-700/90 text-white"
      : "bg-neutral-500/90 text-white";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${cls}`}
    >
      {label}
    </span>
  );
}
