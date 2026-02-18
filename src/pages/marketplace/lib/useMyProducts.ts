// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\lib\useMyProducts.ts
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { listMyProducts, type ProductLite } from "./productApi";

export function useMyProducts() {
  const { status } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ProductLite[]>([]);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await listMyProducts();
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onRefresh = () => refresh();
    window.addEventListener("fm:products-refresh", onRefresh);
    return () => window.removeEventListener("fm:products-refresh", onRefresh);
  }, [refresh]);

  return { loading, items, refresh };
}
