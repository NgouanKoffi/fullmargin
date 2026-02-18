// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\tabs\CartTab.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useCartItems, cartActions } from "../lib/cart";
import { wishlistActions } from "../lib/wishlist";
import { API_BASE } from "../../../lib/api";
import { loadSession } from "../../../auth/lib/storage";
import { useNavigate } from "react-router-dom";

import ProductCardPublic from "../public/components/ProductCardPublic";
import type { PublicProductLite } from "../lib/publicShopApi";
import {
  grantCheckoutGate,
  clearCheckoutIntent,
} from "../../../router/checkoutGate";

type CartLine = { product: PublicProductLite; qty: number };

const fmtMoney = (n = 0, currency = "USD") =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(n);

const openAuth = (mode: "signin" | "signup" = "signin") =>
  window.dispatchEvent(
    new CustomEvent("fm:open-account", { detail: { mode } })
  );

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

export default function CartTab() {
  const navigate = useNavigate();
  const raw = useCartItems();
  const storeIds = useMemo(() => raw.map((r) => r.id), [raw]);

  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  // 🔒 Arriver sur le PANIER = on annule toute intention Buy-Now résiduelle
  useEffect(() => {
    clearCheckoutIntent();
  }, []);

  // Purge des ids masqués qui n’existent plus
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

  // Signature stable (ids + quantités)
  const qtySig = useMemo(
    () =>
      raw
        .filter((r) => !hiddenIds.has(r.id))
        .map((r) => `${r.id}:${Math.max(0, Number(r.qty) || 0)}`)
        .sort()
        .join("|"),
    [raw, hiddenIds]
  );

  const isLoggedIn = !!loadSession()?.token;

  const [lines, setLines] = useState<CartLine[]>([]);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true); // ⬅️ remplace firstLoad

  const reqSeq = useRef(0);
  const prevSigRef = useRef<string>(""); // "idsParam|qtySig"

  useEffect(() => {
    const sig = `${idsParam}|${qtySig}`;
    if (sig === prevSigRef.current && !loading) return; // rien à faire
    prevSigRef.current = sig;

    let alive = true;
    const mySeq = ++reqSeq.current;

    const rawSnapshot = raw.filter((r) => !hiddenIds.has(r.id));
    const qtyMap = new Map(
      rawSnapshot.map((r) => [r.id, Math.max(0, Number(r.qty) || 0)])
    );

    // on démarre le cycle de chargement
    setLoading(true);

    (async () => {
      // Panier vide : stabiliser l'état et couper le loader
      if (!idsParam) {
        if (alive && reqSeq.current === mySeq) {
          setLines((prev) => (prev.length ? [] : prev));
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

        // si ce n'est plus la requête en cours, on ignore
        if (!alive || reqSeq.current !== mySeq) return;

        if (!res.ok) {
          // ❗ important : couper le shimmer même en cas d'erreur
          setLoading(false);
          return;
        }

        const json: { data?: { items?: PublicProductLite[] } } =
          await res.json();
        const items = (json?.data?.items ?? []) as PublicProductLite[];

        const merged: CartLine[] = items
          .map((p) => ({
            product: p,
            qty: Math.max(1, Number(qtyMap.get(p.id) || 1)),
          }))
          .filter((l) => l.qty > 0);

        setLines(merged);
      } catch {
        // en cas d'exception réseau, couper le loader
        if (alive && reqSeq.current === mySeq) setLoading(false);
      } finally {
        if (alive && reqSeq.current === mySeq) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsParam, qtySig]);

  const subtotal = useMemo(
    () =>
      lines.reduce(
        (s, l) =>
          s +
          (l.product.pricing?.amount || 0) *
            (Number.isFinite(l.qty) ? l.qty : 1),
        0
      ),
    [lines]
  );

  function maskId(id: string) {
    setHiddenIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function handleRemoveToWishlist(id: string) {
    if (busy[id]) return;
    setBusy((b) => ({ ...b, [id]: true }));

    maskId(id);
    setLines((prev) => prev.filter((l) => l.product.id !== id));

    wishlistActions.add(id);
    cartActions.setQty(id, 0);

    queueMicrotask(() => setBusy((b) => ({ ...b, [id]: false })));
  }

  function goCheckout() {
    if (!isLoggedIn) {
      openAuth("signin");
      return;
    }
    clearCheckoutIntent();
    grantCheckoutGate();
    navigate("/marketplace/checkout");
  }

  if (!isLoggedIn) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-3">Panier</h2>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 max-[440px]:flex-col max-[440px]:items-stretch">
          <div className="text-sm opacity-80">
            Connectez-vous pour voir votre panier.
          </div>
          <button
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
    <div className="relative pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
      <h2 className="text-xl font-bold mb-3">Panier</h2>

      {loading && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/60 dark:bg-neutral-900/50 p-3 animate-pulse"
            >
              <div className="h-28 rounded-xl bg-neutral-200/70 dark:bg-neutral-800" />
            </li>
          ))}
        </ul>
      )}

      {!loading && lines.length === 0 && (
        <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center">
          <div className="text-lg font-semibold mb-1">
            Votre panier est vide
          </div>
          <div className="text-sm opacity-70">
            Ajoutez des produits depuis la marketplace pour commencer.
          </div>
        </div>
      )}

      {!loading && lines.length > 0 && (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lines.map(({ product }) => (
              <li key={product.id} className="relative overflow-visible">
                <ProductCardPublic
                  product={product}
                  onBuyNow={() => goCheckout()}
                  onAddToCart={() => {}}
                  onToggleFavorite={() => {}}
                />
                <button
                  type="button"
                  aria-label="Retirer du panier"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveToWishlist(product.id);
                  }}
                  disabled={!!busy[product.id]}
                  className={`absolute -top-2 -right-2 z-50 h-9 w-9 inline-flex items-center justify-center rounded-full text-white ring-2 ring-white dark:ring-neutral-900 shadow-lg ${
                    busy[product.id]
                      ? "opacity-50 cursor-not-allowed bg-rose-600"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                  title="Retirer du panier"
                >
                  <IconClose />
                </button>
              </li>
            ))}
          </ul>

          {/* Barre flottante Paiement */}
          <div
            className="
              fixed inset-x-0 bottom-0
              bg-white/90 dark:bg-neutral-900/85 backdrop-blur-lg
              ring-1 ring-black/10 dark:ring-white/10 shadow-xl
              px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]
            "
          >
            <div className="mx-auto w-[min(72rem,100%)] flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
              <div className="flex items-baseline gap-3 max-sm:justify-between">
                <div className="text-sm opacity-80">Sous-total</div>
                <div className="text-2xl font-extrabold text-rose-600">
                  {fmtMoney(subtotal, "USD")}
                </div>
              </div>

              <button
                type="button"
                onClick={goCheckout}
                className="rounded-xl px-5 py-3 text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 w-auto max-sm:w-full"
              >
                Payer maintenant
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
