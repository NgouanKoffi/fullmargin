// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\marketplace\index.tsx
import React, { useState, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowUp } from "lucide-react";

import DataBar from "./composants/ui/DataBar";

import ProductsTable from "./composants/ProductsTable";
import CategoriesTable from "./composants/CategoriesTable";

import { useAdminCategories, useAdminProducts } from "./hooks/useAdminData";

import AdminEditProductModal from "./composants/ui/AdminEditProductModal";
import type { PatchProductBody } from "./api/types";
import AdminPromoCodes from "./composants/AdminPromoCodes";
import AdminPayoutRequests from "./composants/AdminPayoutRequests";
import AdminCommissionsReceived from "./composants/AdminCommissionsReceived";

const money = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
  }).format(n);

type TabKey = "products" | "config" | "promos" | "commissions" | "payouts";

export default function AdminMarketplacePage() {
  // ---------- data ----------
  const {
    items: categories,
    error: catError,
    add: addCategory,
    update: updateCat,
    remove: removeCategory,
  } = useAdminCategories();

  const {
    setFilter,
    setPage,
    items: products,
    page,
    pageSize,
    total,
    loading: prodLoading,
    error: prodError,
    setStatus,
    toggleBadge,
    removeProduct,
    restoreProduct,
    reload,
    updateProduct,
    kpi,
  } = useAdminProducts({ page: 1, pageSize: 25 });

  // ---------- locales ----------
  const [qProd, setQProd] = useState("");
  const [qCat, setQCat] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("products");

  // état sidebar pliée / dépliée (tablette + desktop)
  const [navCollapsed, setNavCollapsed] = useState(false);

  // ref du bloc des onglets (pour scroll depuis le bouton sticky mobile)
  const tabsRef = useRef<HTMLDivElement | null>(null);

  // KPI (sans boutiques)
  const dataBar = useMemo(
    () => [
      {
        label: "Produits (page)",
        value: products.length,
        hint: `Total: ${kpi.totalProducts}`,
      },
      { label: "Validés", value: kpi.validated },
      { label: "Suspendus", value: kpi.suspendedProducts },
      { label: "Catégories", value: categories.length },
    ],
    [products.length, kpi, categories.length]
  );

  const tabs = useMemo(
    () =>
      [
        {
          key: "products" as const,
          label: "Modération produits",
          content: (
            <>
              <ProductsTable
                rows={products}
                money={money}
                onValidate={(id) => setStatus(id, "published")}
                onSuspend={async (id, reason) =>
                  updateProduct(id, {
                    status: "suspended",
                    moderationReason: reason,
                  } as PatchProductBody)
                }
                onReject={async (id, reason) =>
                  updateProduct(id, {
                    status: "rejected",
                    moderationReason: reason,
                  } as PatchProductBody)
                }
                onFeature={async (id, next) => {
                  await updateProduct(id, {
                    featured: next,
                  } as PatchProductBody);
                }}
                onToggleBadge={(id) => toggleBadge(id)}
                onEdit={(id) => setEditId(id)}
                onRemove={async (id, reason) => {
                  if (reason) {
                    await updateProduct(id, {
                      moderationReason: reason,
                    } as PatchProductBody);
                  }
                  await removeProduct(id);
                }}
                onRestore={(id) => restoreProduct(id)}
                q={qProd}
                setQ={(s) => {
                  setQProd(s);
                  setFilter({ q: s });
                }}
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                loading={prodLoading}
              />

              <AdminEditProductModal
                open={!!editId}
                productId={editId}
                onClose={() => setEditId(null)}
                onSave={async (id: string, patch: PatchProductBody) => {
                  await updateProduct(id, patch);
                  await reload();
                  setEditId(null);
                }}
                onRestore={(id) => restoreProduct(id)}
                categories={categories}
              />
            </>
          ),
        },
        {
          key: "config" as const,
          label: "Catégories & commissions",
          content: (
            <CategoriesTable
              rows={categories}
              q={qCat}
              setQ={setQCat}
              onAdd={(payload) => addCategory(payload)}
              onUpdate={(key, patch) => {
                const row = categories.find((c) => c.key === key);
                if (row) return updateCat(row.id, patch);
                return;
              }}
              onRemove={(key) => {
                const row = categories.find((c) => c.key === key);
                if (row) return removeCategory(row.id);
                return;
              }}
            />
          ),
        },
        {
          key: "promos" as const,
          label: "Codes promo",
          content: <AdminPromoCodes money={money} />,
        },
        {
          key: "commissions" as const,
          label: "Commissions reçues",
          content: <AdminCommissionsReceived money={money} />,
        },
        {
          key: "payouts" as const,
          label: "Demandes de paiement",
          content: <AdminPayoutRequests money={money} />,
        },
      ] satisfies Array<{
        key: TabKey;
        label: string;
        content: React.ReactNode;
      }>,
    [
      products,
      setStatus,
      updateProduct,
      toggleBadge,
      removeProduct,
      restoreProduct,
      qProd,
      page,
      pageSize,
      total,
      prodLoading,
      categories,
      qCat,
      addCategory,
      updateCat,
      removeCategory,
      setFilter,
      setPage,
      reload,
      editId,
    ]
  );

  const activeTab = tabs.find((t) => t.key === tab) ?? tabs[0];

  // Sur mobile + tablette : sidebar AU-DESSUS (w-full).
  // A partir de lg (~1024px) seulement : sidebar à gauche (10 / 60 / 72).
  const navWidth = navCollapsed ? "w-full lg:w-10" : "w-full lg:w-60 xl:w-72";

  const scrollToTabs = () => {
    if (!tabsRef.current) return;
    const rect = tabsRef.current.getBoundingClientRect();
    const y = rect.top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div className="relative w-full px-4 md:px-6 py-4 md:py-6 space-y-6">
      <header className="mb-1">
        <h1 className="text-2xl md:text-3xl font-bold">Marketplace</h1>
        <p className="text-sm opacity-70">
          Modération · Produits · Catégories · Codes promo · Demandes de
          paiement
        </p>
      </header>

      <DataBar items={dataBar} />

      {/* Layout tabview latéral */}
      <div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
        {/* NAV LATERALE GAUCHE / EN-HAUT */}
        <nav ref={tabsRef} className={`${navWidth} shrink-0 relative`}>
          {/* Bouton plier / déplier — à partir de lg */}
          <button
            type="button"
            onClick={() => setNavCollapsed((c) => !c)}
            className="hidden lg:flex absolute -right-3 top-3 z-20 h-6 w-6 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-900 text-white dark:bg-white dark:text-slate-900 items-center justify-center text-[10px] shadow-sm"
          >
            {navCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </button>

          {/* Liste des onglets */}
          {!navCollapsed && (
            <div className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              {tabs.map((t, idx) => {
                const isActive = t.key === activeTab.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={[
                      "w-full text-left px-3 py-2.5 text-sm flex items-center gap-2",
                      idx !== tabs.length - 1
                        ? "border-b border-slate-100 dark:border-slate-800"
                        : "",
                      isActive
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
                    ].join(" ")}
                  >
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {/* CONTENU ONGLET */}
        <section className="w-full flex-1 min-w-0">{activeTab.content}</section>
      </div>

      {(catError || prodError) && (
        <div className="text-sm text-rose-600">{catError || prodError}</div>
      )}

      {/* Bouton sticky mobile / tablette pour remonter aux onglets */}
      <button
        type="button"
        onClick={scrollToTabs}
        className="lg:hidden fixed bottom-4 right-4 z-30 h-11 w-11 rounded-full shadow-lg bg-slate-900 text-white flex items-center justify-center active:scale-95"
        title="Aller au menu Marketplace"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}
