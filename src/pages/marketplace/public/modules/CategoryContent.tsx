// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\modules\CategoryContent.tsx
import type { CategoryKey } from "../types";
import ShopTabs from "./ShopTabs";
import ProductsGrid from "./ProductsGrid";

export default function CategoryContent({
  category,
}: {
  category: CategoryKey;
}) {
  if (category === "boutiques") {
    return <ShopTabs />;
  }

  if (category === "all") {
    return (
      <div className="space-y-3">
        <h3 className="text-base font-semibold">Tous les produits</h3>
        <ProductsGrid /* pas de filtre catégorie → tout */ />
      </div>
    );
  }

  if (category === "featured") {
    return (
      <div className="space-y-3">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <span>Produits mis en avant</span>
          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
            Sélection
          </span>
        </h3>
        <ProductsGrid featuredOnly />
      </div>
    );
  }

  // sinon, catégorie spécifique
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">
        Produits — <span className="opacity-70">{category}</span>
      </h3>
      <ProductsGrid categoryKey={category} />
    </div>
  );
}
