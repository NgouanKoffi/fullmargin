// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\tabs\products\ProductList.tsx
import type { ProductLite } from "../../lib/productApi";
import ProductCard from "./ProductCard";

export default function ProductList({
  items,
  onEdit,
  onAfterDelete,
}: {
  items: ProductLite[];
  onEdit: (id: string) => void;
  onAfterDelete: () => void;
}) {
  if (!items.length) {
    return (
      <p className="text-skin-muted">Aucun produit ne correspond au filtre.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((p) => (
        <ProductCard
          key={p.id}
          item={p}
          onEdit={onEdit}
          onAfterDelete={onAfterDelete}
        />
      ))}
    </div>
  );
}
