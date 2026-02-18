// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\tabs\products\ProductCard.tsx
import { memo, useState } from "react";
import type { ProductLite } from "../../lib/productApi";
import { Pencil, Trash2, Eye, BadgeCheck } from "lucide-react";
import ConfirmModal from "./AddForm/ConfirmModal";
import { deleteProduct } from "../../lib/productApi";
import { publicProductUrl } from "../../lib/productUrls";

export default memo(function ProductCard({
  item,
  onEdit,
  onAfterDelete,
}: {
  item: ProductLite;
  onEdit: (id: string) => void;
  onAfterDelete: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const onConfirmDelete = async () => {
    setBusy(true);
    try {
      await deleteProduct(item.id);
      setConfirmOpen(false);
      onAfterDelete();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Suppression impossible");
    } finally {
      setBusy(false);
    }
  };

  const { label: statusText, cls: statusCls } = statusStyle(item.status);

  const showReason =
    (item.status === "rejected" || item.status === "suspended") &&
    !!item.moderationReason?.trim();

  return (
    <article className="group overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/60 shadow-sm hover:shadow-md transition-shadow">
      {/* Media */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800" />
        )}

        {/* ✅ Pastille "Certifié" (icône + libellé) */}
        {item.badgeEligible && (
          <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-violet-600/95 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow ring-1 ring-white/15">
            <BadgeCheck className="w-[14px] h-[14px]" />
            <span className="leading-none">Certifié</span>
          </span>
        )}

        {/* Status chip */}
        <span
          className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full backdrop-blur ${statusCls}`}
          title={item.status}
        >
          {statusText}
        </span>

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold truncate">{item.title}</h3>
            <p className="text-xs mt-0.5 opacity-70 truncate">
              {labelOfType(item.type)}
            </p>
          </div>

          {/* Actions */}
          <div className="shrink-0 inline-flex items-center gap-1">
            {/* Aperçu */}
            <a
              href={publicProductUrl(item.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-800/70 hover:bg-white dark:hover:bg-neutral-800"
              title="Aperçu (nouvel onglet)"
            >
              <Eye className="w-[18px] h-[18px]" />
            </a>

            {/* Modifier */}
            <button
              type="button"
              onClick={() => onEdit(item.id)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-800/70 hover:bg-white dark:hover:bg-neutral-800"
              title="Modifier"
            >
              <Pencil className="w-[18px] h-[18px]" />
            </button>

            {/* Supprimer */}
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={busy}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-800/70 hover:bg-white dark:hover:bg-neutral-800 text-rose-600 dark:text-rose-400 disabled:opacity-50"
              title="Supprimer"
            >
              <Trash2 className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* Motif de rejet/suspension */}
        {showReason && (
          <div
            className="mt-2 text-xs rounded-md px-3 py-2 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
            title={item.moderationReason}
          >
            <span className="font-semibold">
              {item.status === "rejected"
                ? "Motif de rejet"
                : "Motif de suspension"}
              {": "}
            </span>
            <span className="line-clamp-2">{item.moderationReason}</span>
          </div>
        )}

        {/* Footer : uniquement le prix */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm font-semibold">
            {item.pricing.mode === "one_time"
              ? `${item.pricing.amount.toLocaleString()} $`
              : `${item.pricing.amount.toLocaleString()} $ / ${
                  item.pricing.interval === "month" ? "mois" : "an"
                }`}
          </div>
        </div>
      </div>

      {/* Confirm delete modal */}
      <ConfirmModal
        open={confirmOpen}
        title="Supprimer le produit"
        message="Cette action est réversible (suppression logique). Confirmer ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={onConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
        busy={busy}
      />
    </article>
  );
});

function labelOfType(t: ProductLite["type"]) {
  switch (t) {
    case "robot_trading":
      return "Robot de trading";
    case "indicator":
      return "Indicateur";
    case "ebook_pdf":
      return "E-book / PDF / Livre";
    case "template_excel":
      return "Template / Outil Excel";
    default:
      return t;
  }
}

function statusStyle(s: ProductLite["status"]): { label: string; cls: string } {
  switch (s) {
    case "published":
      return { label: "publié", cls: "bg-emerald-600/90 text-white" };
    case "pending":
      return { label: "en attente", cls: "bg-amber-500/90 text-white" };
    case "rejected":
      return { label: "refusé", cls: "bg-rose-600/90 text-white" };
    case "suspended":
      return { label: "suspendu", cls: "bg-fuchsia-600/90 text-white" };
    case "draft":
    default:
      return { label: "brouillon", cls: "bg-neutral-600/90 text-white" };
  }
}
