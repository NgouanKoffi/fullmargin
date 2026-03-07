import {
  Percent,
  BadgeDollarSign,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Layers,
  Package2,
  Eye,
  Store,
  Trash2,
} from "lucide-react";
import type { AdminPromo } from "../../api/types";

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—");

export default function PromoCard({
  p,
  money,
  onToggle,
  onRemove,
}: {
  p: AdminPromo;
  money: (n: number) => string;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const TypeIcon = p.type === "percent" ? Percent : BadgeDollarSign;

  const scopeChip =
    p.scope === "category"
      ? {
          icon: <Layers className="h-3.5 w-3.5" />,
          text: p.categoryKey || "Catégorie",
        }
      : p.scope === "product"
      ? {
          icon: <Package2 className="h-3.5 w-3.5" />,
          text: p.productTitle || p.productId || "Produit",
        }
      : p.scope === "shop"
      ? {
          icon: <Store className="h-3.5 w-3.5" />,
          text: p.shopName || p.shopId || "Boutique",
        }
      : { icon: <Eye className="h-3.5 w-3.5" />, text: "Global" };

  // Couleur du ruban
  const stripe =
    p.scope === "category"
      ? "from-violet-500 to-fuchsia-500"
      : p.scope === "product"
      ? "from-sky-500 to-cyan-500"
      : p.scope === "shop"
      ? "from-amber-500 to-orange-500"
      : "from-neutral-500 to-neutral-600";

  return (
    <div className="relative w-full">
      {/* Ruban gauche */}
      <div
        className={`absolute inset-y-0 left-0 w-1.5 rounded-l-2xl bg-gradient-to-b ${stripe}`}
        aria-hidden
      />
      <div
        className="
          pl-4
          rounded-2xl bg-white/90 dark:bg-neutral-950/90
          ring-1 ring-black/10 dark:ring-white/10
          p-5 md:p-6
          flex flex-col gap-4
          shadow-sm hover:shadow-lg transition-shadow
        "
      >
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
              <TypeIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-mono font-semibold text-sm tracking-wide truncate">
                {p.code}
              </div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-[11px]">
                {scopeChip.icon}
                <span className="truncate max-w-[220px] sm:max-w-[260px]">
                  {scopeChip.text}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl md:text-3xl font-extrabold leading-none">
              {p.type === "percent" ? `${p.value}%` : money(p.value)}
            </div>
            <div className="text-[11px] opacity-70 mt-1">Remise</div>
          </div>
        </div>

        {/* Validité */}
        <div className="grid grid-cols-2 gap-3 text-xs text-neutral-700 dark:text-neutral-300">
          <div className="inline-flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span className="opacity-80">{fmt(p.startsAt)}</span>
          </div>
          <div className="inline-flex items-center gap-2 justify-end sm:justify-start">
            <span className="opacity-50">→</span>
            <span className="opacity-80">{fmt(p.endsAt)}</span>
          </div>
          <div className="col-span-2 opacity-80">
            Usages&nbsp;: <strong>{p.used ?? 0}</strong> / {p.maxUse ?? "∞"}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-1 flex items-center justify-between gap-3">
          <div
            className={`inline-flex items-center gap-1 text-sm ${
              p.active ? "text-emerald-600" : "text-neutral-500"
            }`}
          >
            {p.active ? (
              <>
                <ToggleRight className="h-4 w-4" /> Actif
              </>
            ) : (
              <>
                <ToggleLeft className="h-4 w-4" /> Inactif
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggle(p.id)}
              className="
                rounded-lg px-3.5 py-2 text-sm
                bg-neutral-900 text-white hover:bg-black
                dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200
                transition-colors
              "
            >
              {p.active ? "Désactiver" : "Activer"}
            </button>
            <button
              onClick={() => onRemove(p.id)}
              className="
                inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm
                text-rose-600 ring-1 ring-rose-300/60 hover:bg-rose-50/70
                dark:hover:bg-rose-900/20
              "
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
