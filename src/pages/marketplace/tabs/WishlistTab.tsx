// src/pages/marketplace/tabs/WishlistTab.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useWishlistIds, wishlistActions } from "../lib/wishlist";
import { cartActions } from "../lib/cart";
import { API_BASE } from "../../../lib/api";
import { loadSession } from "../../../auth/lib/storage";

import ProductCardPublic from "../public/components/ProductCardPublic";
import type { PublicProductLite } from "../lib/publicShopApi";

const openAuth = (mode: "signin" | "signup" = "signin") =>
  window.dispatchEvent(
    new CustomEvent("fm:open-account", { detail: { mode } })
  );

function ShimmerCard() {
  return (
    <li className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/60 dark:bg-neutral-900/50 p-3 animate-pulse">
      <div className="h-28 rounded-xl bg-neutral-200/70 dark:bg-neutral-800" />
    </li>
  );
}
function IconClose() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export default function WishlistTab() {
  const storeIds = useWishlistIds();
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  // purge des ids masqués disparus
  useEffect(() => {
    if (!hiddenIds.size) return;
    const next = new Set(hiddenIds);
    let changed = false;
    for (const id of hiddenIds) {
      if (!storeIds.includes(id)) {
        next.delete(id);
        changed = true;
      }
    }
    if (changed) setHiddenIds(next);
  }, [storeIds, hiddenIds]);

  const effectiveIds = useMemo(
    () => storeIds.filter((id) => !hiddenIds.has(id)),
    [storeIds, hiddenIds]
  );
  const idsParam = useMemo(
    () => [...effectiveIds].sort().join(","),
    [effectiveIds]
  );

  const isLoggedIn = !!loadSession()?.token;

  const [items, setItems] = useState<PublicProductLite[]>([]);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true); // ⬅️ remplace firstLoad
  const reqSeq = useRef(0);
  const prevSig = useRef<string>("");

  // fetch contrôlé + arrêt du shimmer dans TOUS les cas
  useEffect(() => {
    const sig = idsParam;
    if (sig === prevSig.current && !loading) return;
    prevSig.current = sig;

    let alive = true;
    const mySeq = ++reqSeq.current;

    setLoading(true);

    (async () => {
      // liste vide → stabiliser l'état et couper le loader
      if (!idsParam) {
        if (alive && reqSeq.current === mySeq) {
          setItems((prev) => (prev.length ? [] : prev));
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE}/marketplace/public/products?ids=${encodeURIComponent(
            idsParam
          )}`,
          { cache: "no-store" }
        );
        if (!alive || reqSeq.current !== mySeq) return;

        if (!res.ok) {
          setLoading(false); // ❗ stop shimmer même si erreur HTTP
          return;
        }

        const json: { data?: { items?: PublicProductLite[] } } =
          await res.json();
        const list = (json?.data?.items ?? []) as PublicProductLite[];

        if (!alive || reqSeq.current !== mySeq) return;
        setItems(list);
        setLoading(false);
      } catch {
        if (alive && reqSeq.current === mySeq) setLoading(false); // ❗ stop shimmer si exception réseau
      }
    })();

    return () => {
      alive = false;
    };
  }, [idsParam, loading]);

  function maskId(id: string) {
    setHiddenIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function handleAddToCart(id: string) {
    if (busy[id]) return;
    setBusy((b) => ({ ...b, [id]: true }));

    maskId(id);
    setItems((prev) => prev.filter((p) => p.id !== id));

    cartActions.setQty(id, 1);
    wishlistActions.remove(id);

    queueMicrotask(() => setBusy((b) => ({ ...b, [id]: false })));
  }

  function handleRemoveFromWishlist(id: string) {
    if (busy[id]) return;
    setBusy((b) => ({ ...b, [id]: true }));

    maskId(id);
    setItems((prev) => prev.filter((p) => p.id !== id));
    wishlistActions.remove(id);

    queueMicrotask(() => setBusy((b) => ({ ...b, [id]: false })));
  }

  function addAllToCart() {
    items.forEach((p) => {
      cartActions.setQty(p.id, 1);
      wishlistActions.remove(p.id);
      maskId(p.id);
    });
    setItems([]);
  }

  if (!isLoggedIn) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-3">Liste d’envies</h2>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 max-[440px]:flex-col max-[440px]:items-stretch">
          <div className="text-sm opacity-80">
            Connectez-vous pour voir votre liste d’envies.
          </div>
          <button
            type="button"
            onClick={() => openAuth("signin")}
            className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 max-[440px]:w-full max-[440px]:mt-2"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">Liste d’envies</h2>
        {items.length > 0 && (
          <button
            type="button"
            onClick={addAllToCart}
            className="text-sm rounded-lg px-3 py-1.5 bg-violet-600 text-white hover:bg-violet-700"
          >
            Tout ajouter au panier
          </button>
        )}
      </div>

      {loading && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
        </ul>
      )}

      {!loading && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center">
          <div className="text-lg font-semibold mb-1">Aucun favori</div>
          <div className="text-sm opacity-70">
            Ajoutez des produits pour les retrouver ici.
          </div>
        </div>
      )}

      {!loading && items.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <li key={p.id} className="relative overflow-visible">
              <ProductCardPublic
                product={p}
                onAddToCart={() => handleAddToCart(p.id)}
                onToggleFavorite={() => {}}
              />

              {/* X collé en haut-droite, visible */}
              <button
                type="button"
                aria-label="Retirer de la liste d’envies"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemoveFromWishlist(p.id);
                }}
                disabled={!!busy[p.id]}
                className={`absolute -top-2 -right-2 z-50 h-9 w-9 inline-flex items-center justify-center rounded-full text-white ring-2 ring-white dark:ring-neutral-900 shadow-lg ${
                  busy[p.id]
                    ? "opacity-50 cursor-not-allowed bg-rose-600"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
                title="Retirer des favoris"
              >
                <IconClose />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
