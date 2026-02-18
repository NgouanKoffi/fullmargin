// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\lib\useShopStatus.ts
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { getMyShop, type Shop } from "./shopApi";

export function useShopStatus() {
  const { status } = useAuth(); // on lit juste l’état, on ne modifie rien
  const [loading, setLoading] = useState(false);
  const [shop, setShop] = useState<Shop | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refreshShop = async () => {
    if (status !== "authenticated") {
      setShop(null);
      return;
    }
    setLoading(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const s = await getMyShop();
      setShop(s);
    } catch {
      // on ne notifie pas ici; UI décidera
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshShop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Permettre à n’importe quel écran de déclencher un refresh :
  useEffect(() => {
    const onRefresh = () => refreshShop();
    window.addEventListener("fm:shop-refresh", onRefresh);
    return () => window.removeEventListener("fm:shop-refresh", onRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    loading,
    shop,
    hasShop: !!shop,
    refreshShop,
  };
}
