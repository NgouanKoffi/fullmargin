// src/pages/admin/marketplace/composants/ProductCard.tsx
import { useState } from "react";
import {
  Eye,
  Store,
  Award,
  Megaphone,
  Loader2,
  RotateCcw,
  PauseCircle,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  BadgeCheck,
  Star,
} from "lucide-react";
import StatusPill from "./ui/StatusPill";
import type { AdminProductItem } from "../api/types";

export type ProductWithFeatured = AdminProductItem & { featured?: boolean };

type Props = {
  p: ProductWithFeatured;
  money: (n: number) => string;
  isFeatureBusy: boolean;
  featureOverrideValue?: boolean;
  onValidate: (id: string) => Promise<void> | void;
  onEdit: (id: string) => void;
  onRestore: (id: string) => Promise<void> | void;
  onToggleBadge: (id: string) => Promise<void> | void;
  onFeatureToggle: (id: string, next: boolean) => void;
  onRequestAction: (
    action: "suspend" | "reject" | "delete",
    p: ProductWithFeatured,
  ) => void;
};

export default function ProductCard({
  p,
  money,
  isFeatureBusy,
  featureOverrideValue,
  onValidate,
  onEdit,
  onRestore,
  onToggleBadge,
  onFeatureToggle,
  onRequestAction,
}: Props) {
  // ✅ ÉTAT LOCAL POUR LE CHARGEMENT DES BOUTONS
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const runAction = async (
    actionName: string,
    cb: () => Promise<void> | void,
  ) => {
    setBusyAction(actionName);
    try {
      await cb();
    } finally {
      setBusyAction(null);
    }
  };

  const isDeleted = !!p.deletedAt;
  const isFeatured = featureOverrideValue ?? p.featured ?? false;
  const deletedDate = p.deletedAt ? new Date(p.deletedAt).toLocaleString() : "";
  const badgeLocked =
    isDeleted || p.status === "rejected" || p.status === "suspended";

  const creatorName =
    p.createdBy?.name ||
    [p.createdBy?.firstName, p.createdBy?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
  const creatorEmail = (p.createdBy?.email || "").trim();

  const previewHref = `/marketplace/public/product/${encodeURIComponent(p.id)}`;
  const shopHref = `/marketplace/public/shop/${encodeURIComponent(p.shop?.slug || p.shop?.id || "")}`;

  return (
    <div
      className={`rounded-xl ring-1 ring-black/10 dark:ring-white/10 bg-white dark:bg-neutral-950 overflow-hidden flex flex-col ${isDeleted ? "opacity-75" : ""}`}
    >
      <div className="relative">
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt=""
            className="w-full aspect-[16/9] object-cover"
          />
        ) : (
          <div className="w-full aspect-[16/9] bg-neutral-100 dark:bg-neutral-800 grid place-items-center text-neutral-400 text-xs">
            Pas d’image
          </div>
        )}
        <div className="absolute right-2 top-2 flex gap-1 flex-wrap items-start">
          <span
            className={`flex items-center gap-1 bg-emerald-600 text-white text-[11px] px-2 py-0.5 rounded-md shadow-sm transition-all duration-200 ${isFeatured ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"}`}
          >
            <BadgeCheck size={12} /> En avant
          </span>
          {p.badgeEligible && !isDeleted && (
            <span className="flex items-center gap-1 bg-violet-600 text-white text-[11px] px-2 py-0.5 rounded-md shadow-sm">
              <Star size={12} /> Vérifié
            </span>
          )}
          {isDeleted && (
            <span className="flex items-center gap-1 bg-rose-600 text-white text-[11px] px-2 py-0.5 rounded-md shadow-sm">
              Supprimé
            </span>
          )}
          <StatusPill status={p.status} />
        </div>
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="text-sm font-semibold line-clamp-2">{p.title}</div>
        <div className="text-[11px] opacity-70">
          {p.category?.label || p.category?.key || "—"}
        </div>

        <div className="text-[11px] leading-4">
          <div className="opacity-70">
            Créateur :{" "}
            <span className="font-medium opacity-100">
              {creatorName || "—"}
            </span>
          </div>
          {!!creatorEmail && <div className="opacity-70">{creatorEmail}</div>}
        </div>

        <div className="font-semibold mt-1">
          {money(p.pricing?.amount || 0)}
        </div>
        {isDeleted && (
          <div className="text-[11px] text-rose-500">
            Supprimé le {deletedDate}
          </div>
        )}

        {/* Boutons d'action avec Spinner */}
        <div className="mt-auto pt-2 flex flex-wrap justify-start gap-2">
          <a
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] ring-1 hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            <Eye className="h-4 w-4" /> Aperçu
          </a>
          <a
            href={shopHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] ring-1 hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            <Store className="h-4 w-4" /> Boutique
          </a>

          <button
            onClick={() =>
              !badgeLocked && runAction("badge", () => onToggleBadge(p.id))
            }
            disabled={badgeLocked || busyAction === "badge"}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] text-white ${p.badgeEligible ? "bg-violet-600 hover:bg-violet-700" : "bg-neutral-600 hover:bg-neutral-700"} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {busyAction === "badge" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Award className="h-4 w-4" />
            )}
            {p.badgeEligible ? "Retirer badge" : "Ajouter badge"}
          </button>

          <button
            onClick={() => onFeatureToggle(p.id, !isFeatured)}
            disabled={isDeleted || p.status !== "published" || isFeatureBusy}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] text-white disabled:opacity-50 disabled:cursor-not-allowed ${isFeatured ? "bg-emerald-700 hover:bg-emerald-800" : "bg-emerald-600 hover:bg-emerald-700"}`}
          >
            {isFeatureBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Megaphone className="h-4 w-4" />
            )}
            {isFeatureBusy
              ? "Traitement…"
              : isFeatured
                ? "Retirer de l’avant"
                : "Mettre en avant"}
          </button>

          {isDeleted ? (
            <button
              onClick={() => runAction("restore", () => onRestore(p.id))}
              disabled={busyAction === "restore"}
              className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busyAction === "restore" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}{" "}
              Restaurer
            </button>
          ) : p.status === "published" ? (
            <button
              onClick={() => onRequestAction("suspend", p)}
              className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] bg-amber-600 text-white hover:bg-amber-700"
            >
              <PauseCircle className="h-4 w-4" /> Suspendre
            </button>
          ) : (
            <>
              <button
                onClick={() => runAction("validate", () => onValidate(p.id))}
                disabled={busyAction === "validate"}
                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {busyAction === "validate" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}{" "}
                Publier
              </button>
              {p.status !== "rejected" && (
                <button
                  onClick={() => onRequestAction("reject", p)}
                  className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] bg-red-600 text-white hover:bg-red-700"
                >
                  <XCircle className="h-4 w-4" /> Rejeter
                </button>
              )}
            </>
          )}

          <button
            onClick={() => !isDeleted && onEdit(p.id)}
            disabled={isDeleted}
            className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] ring-1 hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50"
          >
            <Pencil className="h-4 w-4" /> Éditer
          </button>
          <button
            onClick={() => !isDeleted && onRequestAction("delete", p)}
            disabled={isDeleted}
            className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
