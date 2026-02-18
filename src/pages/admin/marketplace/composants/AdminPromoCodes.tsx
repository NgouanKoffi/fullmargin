// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\marketplace\composants\AdminPromoCodes.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Layers,
  Package2,
  Store,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import PromoCard from "./promo/PromoCard";
import CreatePromoModal from "./promo/CreatePromoModal";
import type { AdminPromo, CreatePromoBody } from "../api/types";
import {
  createPromo,
  deletePromo,
  listPromos,
  patchPromo,
} from "../api/client";

function CollapsibleSection({
  title,
  count,
  children,
}: {
  title: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="w-full rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold">{title}</span>
          <span className="opacity-70">· {count}</span>
        </div>
        {open ? <ChevronUp /> : <ChevronDown />}
      </button>
      {open && <div className="w-full px-5 pb-5">{children}</div>}
    </section>
  );
}

export default function AdminPromoCodes({
  money,
}: {
  money: (n: number) => string;
}) {
  const [rows, setRows] = useState<AdminPromo[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const r = await listPromos();
      if (r.ok) setRows(r.data.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const kpi = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.active).length;
    const disabled = total - active;
    return { total, active, disabled };
  }, [rows]);

  const byScope = useMemo(
    () => ({
      global: rows.filter((r) => r.scope === "global"),
      category: rows.filter((r) => r.scope === "category"),
      product: rows.filter((r) => r.scope === "product"),
      shop: rows.filter((r) => r.scope === "shop"),
    }),
    [rows]
  );

  async function onCreate(payload: CreatePromoBody) {
    const r = await createPromo(payload);
    if (r.ok) await reload();
  }

  async function onToggle(id: string) {
    const p = rows.find((x) => x.id === id);
    if (!p) return;
    const r = await patchPromo(id, { active: !p.active });
    if (r.ok) await reload();
  }

  async function onRemove(id: string) {
    const r = await deletePromo(id);
    if (r.ok) setRows((prev) => prev.filter((x) => x.id !== id));
  }

  const Grid = ({ items }: { items: AdminPromo[] }) =>
    items.length === 0 ? (
      <div className="w-full py-10 text-center opacity-60">
        Aucun code pour cette section.
      </div>
    ) : (
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8">
        {items.map((p) => (
          <PromoCard
            key={p.id}
            p={p}
            money={money}
            onToggle={onToggle}
            onRemove={onRemove}
          />
        ))}
      </div>
    );

  return (
    <section className="w-full space-y-5">
      {/* En-tête pleine largeur */}
      <div className="w-full rounded-2xl p-5 ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Codes promo</h3>
          <p className="text-xs opacity-70">
            Total: {kpi.total} · Actifs: {kpi.active} · Inactifs: {kpi.disabled}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 h-10 rounded-xl px-3 text-sm font-semibold bg-neutral-900 text-white ring-1 ring-white/10 hover:bg-black"
          >
            <Plus className="w-4 h-4" /> Créer
          </button>
        </div>
      </div>

      {/* Sections repliables */}
      <CollapsibleSection
        title={
          <span className="inline-flex items-center gap-2">
            <Eye className="h-4 w-4" /> Global
          </span>
        }
        count={byScope.global.length}
      >
        {loading && rows.length === 0 ? (
          <div className="py-10 text-center opacity-60">Chargement…</div>
        ) : (
          <Grid items={byScope.global} />
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title={
          <span className="inline-flex items-center gap-2">
            <Layers className="h-4 w-4" /> Par catégorie
          </span>
        }
        count={byScope.category.length}
      >
        <Grid items={byScope.category} />
      </CollapsibleSection>

      <CollapsibleSection
        title={
          <span className="inline-flex items-center gap-2">
            <Package2 className="h-4 w-4" /> Par produit
          </span>
        }
        count={byScope.product.length}
      >
        <Grid items={byScope.product} />
      </CollapsibleSection>

      <CollapsibleSection
        title={
          <span className="inline-flex items-center gap-2">
            <Store className="h-4 w-4" /> Par boutique
          </span>
        }
        count={byScope.shop.length}
      >
        <Grid items={byScope.shop} />
      </CollapsibleSection>

      <CreatePromoModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={onCreate}
      />
    </section>
  );
}
