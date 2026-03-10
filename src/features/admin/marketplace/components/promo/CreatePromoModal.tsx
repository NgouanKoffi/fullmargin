// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\marketplace\composants\promo\CreatePromoModal.tsx
import { useCallback, useEffect, useState } from "react";
import { Tag } from "lucide-react";
import AsyncSearchSelect, { type SelectOption } from "./AsyncSearchSelect";
import type {
  AdminCategory,
  AdminProductItem,
  AdminShopItem,
  CreatePromoBody,
} from "../../api/types";
import {
  listCategories,
  listProducts as fetchProductsApi,
  listShops,
} from "../../api/client";

/* =========================================================
   Modal création code promo
   - Chaque input sur sa propre ligne
   - Onglet actif rose (clair/sombre)
   - Sélecteurs asynchrones typés (catégorie, boutique, produit)
   - Produit dépend de la boutique
   - Scroll vertical si contenu long
========================================================= */

type Scope = "global" | "category" | "shop" | "product";
type PromoType = "percent" | "amount";

export default function CreatePromoModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreatePromoBody) => Promise<void>;
}) {
  // Champs de base
  const [code, setCode] = useState("WELCOME10");
  const [type, setType] = useState<PromoType>("percent");
  const [value, setValue] = useState<number>(10);
  const [scope, setScope] = useState<Scope>("global");
  const [startsAt, setStartsAt] = useState<string>("");
  const [endsAt, setEndsAt] = useState<string>("");
  const [maxUse, setMaxUse] = useState<string>("");
  const [active, setActive] = useState<boolean>(true);

  // Sélections asynchrones
  const [catOpt, setCatOpt] = useState<SelectOption<string> | null>(null);
  const [shopOpt, setShopOpt] = useState<SelectOption<string> | null>(null);
  const [prodOpt, setProdOpt] = useState<SelectOption<string> | null>(null);

  // Reset des champs dépendants quand on change de scope
  useEffect(() => {
    if (scope === "global") {
      setCatOpt(null);
      setShopOpt(null);
      setProdOpt(null);
    } else if (scope === "category") {
      setShopOpt(null);
      setProdOpt(null);
    } else if (scope === "shop") {
      setCatOpt(null);
      setProdOpt(null);
    } else if (scope === "product") {
      setCatOpt(null);
      // shop/prod gérés par le handler ci-dessous
    }
  }, [scope]);

  /* =======================
     Fetchers & mappers
  ======================= */

  const fetchCats = useCallback(async (q: string): Promise<AdminCategory[]> => {
    const r = await listCategories();
    if (r.ok) {
      const items = r.data.items;
      const S = q.trim().toLowerCase();
      return S
        ? items.filter(
            (c) =>
              (c.label || "").toLowerCase().includes(S) ||
              (c.key || "").toLowerCase().includes(S)
          )
        : items;
    }
    return [];
  }, []);

  const fetchShops = useCallback(
    async (q: string): Promise<AdminShopItem[]> => {
      const r = await listShops(q);
      return r.ok ? r.data.items : [];
    },
    []
  );

  const fetchProductsForShop = useCallback(
    async (q: string): Promise<AdminProductItem[]> => {
      if (!shopOpt) return [];
      const r = await fetchProductsApi({
        q,
        shopId: shopOpt.value,
        page: 1,
        pageSize: 20,
      });
      return r.ok ? r.data.items : [];
    },
    [shopOpt]
  );

  const catToOpt = (c: AdminCategory): SelectOption<string> => ({
    value: c.key,
    label: c.label,
    meta: `clé: ${c.key}`,
  });

  const shopToOpt = (s: AdminShopItem): SelectOption<string> => ({
    value: s.id,
    label: s.name,
    meta:
      s.stats?.productsPublished != null
        ? `${s.stats.productsPublished} publiés / ${s.stats.productsTotal} au total`
        : "",
  });

  const prodToOpt = (p: AdminProductItem): SelectOption<string> => ({
    value: p.id,
    label: p.title || "(Sans titre)",
    meta: p.category?.label || p.category?.key || "",
  });

  /* =======================
     Soumission
  ======================= */
  const canSubmit =
    code.trim().length >= 3 &&
    value > 0 &&
    (scope !== "category" || !!catOpt) &&
    (scope !== "shop" || !!shopOpt) &&
    (scope !== "product" || (!!shopOpt && !!prodOpt));

  async function handleSubmit() {
    if (!canSubmit) return;

    const payload: CreatePromoBody = {
      code: code.trim().toUpperCase(),
      type,
      value: Math.floor(value),
      scope,
      active,
      startsAt: startsAt || undefined,
      endsAt: endsAt || undefined,
      maxUse: maxUse ? Math.max(1, Number(maxUse)) : undefined,
      categoryKey: scope === "category" ? catOpt?.value : undefined,
      shopId: scope === "shop" ? shopOpt?.value : undefined,
      productId: scope === "product" ? prodOpt?.value : undefined,
    };
    await onCreate(payload);
    onClose();
  }

  /* =======================
     UI helpers
  ======================= */
  const ScopeButton = ({ label, v }: { label: string; v: Scope }) => {
    const isActive = scope === v;
    return (
      <button
        type="button"
        onClick={() => setScope(v)}
        className={`w-full h-11 rounded-xl px-3 text-sm font-medium ring-1 transition
        ${
          isActive
            ? "bg-rose-600 text-white ring-rose-500"
            : "bg-white text-neutral-900 ring-black/10 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-100 dark:ring-white/10 dark:hover:bg-neutral-800"
        }`}
      >
        {label}
      </button>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-black/10 dark:ring-white/10">
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/10 dark:border-white/10">
          <h3 className="text-lg font-semibold">Créer un code promo</h3>
        </div>

        {/* Content (scrollable) */}
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto space-y-4">
          {/* Code */}
          <div>
            <label className="text-xs font-semibold block mb-1">Code</label>
            <div className="relative">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="WELCOME10"
                className="h-11 w-full rounded-xl px-9 text-sm bg-white dark:bg-neutral-950
                           ring-1 ring-black/10 dark:ring-white/10 outline-none
                           focus:ring-2 focus:ring-rose-500/60"
              />
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
            </div>
          </div>

          {/* Type & Valeur */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PromoType)}
                className="h-11 w-full rounded-xl px-3 text-sm bg-white dark:bg-neutral-950
                           ring-1 ring-black/10 dark:ring-white/10 outline-none
                           focus:ring-2 focus:ring-rose-500/60"
              >
                <option value="percent">Pourcentage (%)</option>
                <option value="amount">Montant fixe</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Valeur</label>
              <input
                type="number"
                min={1}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                placeholder={type === "percent" ? "% 10" : "5"}
                className="h-11 w-full rounded-xl px-3 text-sm bg-white dark:bg-neutral-950
                           ring-1 ring-black/10 dark:ring-white/10 outline-none
                           focus:ring-2 focus:ring-rose-500/60"
              />
            </div>
          </div>

          {/* Portée */}
          <div>
            <label className="text-xs font-semibold block mb-2">Portée</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <ScopeButton label="Global" v="global" />
              <ScopeButton label="Par catégorie" v="category" />
              <ScopeButton label="Par boutique" v="shop" />
              <ScopeButton label="Par produit" v="product" />
            </div>
          </div>

          {/* Sélecteurs dépendants */}
          {scope === "category" && (
            <div>
              <label className="text-xs font-semibold block mb-1">
                Catégorie
              </label>
              <AsyncSearchSelect<AdminCategory>
                fetcher={fetchCats}
                toOption={catToOpt}
                value={catOpt}
                onChange={setCatOpt}
                placeholder="Rechercher une catégorie…"
              />
            </div>
          )}

          {scope === "shop" && (
            <div>
              <label className="text-xs font-semibold block mb-1">
                Boutique
              </label>
              <AsyncSearchSelect<AdminShopItem>
                fetcher={fetchShops}
                toOption={shopToOpt}
                value={shopOpt}
                onChange={setShopOpt}
                placeholder="Rechercher une boutique…"
              />
            </div>
          )}

          {scope === "product" && (
            <>
              <div>
                <label className="text-xs font-semibold block mb-1">
                  Boutique
                </label>
                <AsyncSearchSelect<AdminShopItem>
                  fetcher={fetchShops}
                  toOption={shopToOpt}
                  value={shopOpt}
                  onChange={(opt) => {
                    setShopOpt(opt);
                    setProdOpt(null); // reset produit si on change de boutique
                  }}
                  placeholder="Choisir une boutique…"
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">
                  Produit
                </label>
                <AsyncSearchSelect<AdminProductItem>
                  fetcher={fetchProductsForShop}
                  toOption={prodToOpt}
                  value={prodOpt}
                  onChange={setProdOpt}
                  disabled={!shopOpt}
                  placeholder={
                    shopOpt
                      ? "Rechercher un produit…"
                      : "Sélectionnez d’abord une boutique"
                  }
                />
              </div>
            </>
          )}

          {/* Dates & quota */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Début</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="h-11 w-full rounded-xl px-3 text-sm bg-white dark:bg-neutral-950
                           ring-1 ring-black/10 dark:ring-white/10 outline-none
                           focus:ring-2 focus:ring-rose-500/60"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">
                Fin (optionnel)
              </label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="h-11 w-full rounded-xl px-3 text-sm bg-white dark:bg-neutral-950
                           ring-1 ring-black/10 dark:ring-white/10 outline-none
                           focus:ring-2 focus:ring-rose-500/60"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">
              Max utilisations (∞ si vide)
            </label>
            <input
              type="number"
              min={1}
              value={maxUse}
              onChange={(e) => setMaxUse(e.target.value)}
              placeholder="ex: 100"
              className="h-11 w-full rounded-xl px-3 text-sm bg-white dark:bg-neutral-950
                         ring-1 ring-black/10 dark:ring-white/10 outline-none
                         focus:ring-2 focus:ring-rose-500/60"
            />
          </div>

          {/* Activer immédiatement */}
          <label className="inline-flex items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 accent-rose-600"
            />
            <span className="text-sm">Activer immédiatement</span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-black/10 dark:border-white/10 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl ring-1 ring-black/10 dark:ring-white/10
                       bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="h-10 px-4 rounded-xl bg-rose-600 text-white font-semibold
                       hover:bg-rose-700 disabled:opacity-50"
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}
