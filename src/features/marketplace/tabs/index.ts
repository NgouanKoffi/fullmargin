import type { ComponentType } from "react";

import CartTab from "./CartTab";
import WishlistTab from "./WishlistTab";
import OrdersTab from "./OrdersTab";
import ProductsTab from "./ProductsTab";
import VentesTab from "./Ventestab";
import DashboardHome from "./DashboardHome";
import ShopTab from "./shop/ShopTab";
import WithdrawTab from "./WithdrawTab"; // ⬅️ AJOUT

export type TabKey =
  | "dashboard"
  | "cart"
  | "wishlist"
  | "orders"
  | "shop"
  | "products"
  | "ventes"
  | "withdraw"; // ⬅️ AJOUT

type TabMeta = { comp: ComponentType; requiresShop?: boolean };

const TABS: Record<TabKey, TabMeta> = {
  dashboard: { comp: DashboardHome },
  cart: { comp: CartTab },
  wishlist: { comp: WishlistTab },
  orders: { comp: OrdersTab },
  shop: { comp: ShopTab },
  products: { comp: ProductsTab, requiresShop: true },
  ventes: { comp: VentesTab, requiresShop: true },
  withdraw: { comp: WithdrawTab, requiresShop: true }, // ⬅️ AJOUT
};

export function getTabMeta(key: string | null | undefined): TabMeta {
  const k = (key || "dashboard") as TabKey;
  return TABS[k] ?? { comp: DashboardHome };
}
