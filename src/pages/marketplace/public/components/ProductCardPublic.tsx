// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\components\ProductCardPublic.tsx
import { memo, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { PublicProductLite } from "../../lib/publicShopApi";
import { publicProductUrl } from "../../lib/publicShopApi";

import CartButton from "./CartButton";
import FavoriteButton from "./FavoriteButton";
import RatingBadge from "./RatingBadge";
import { useWishlistHas, wishlistActions } from "../../lib/wishlist";
import { useCartHas, cartActions } from "../../lib/cart";
import { loadSession } from "../../../../auth/lib/storage";
import {
  grantCheckoutGate,
  setCheckoutIntent,
} from "../../../../router/checkoutGate";
import { BadgeCheck } from "lucide-react";

export type ProductCardPublicProps = {
  product: PublicProductLite;
  onAddToCart?: (p: PublicProductLite) => void;
  onToggleFavorite?: (p: PublicProductLite, liked: boolean) => void;
  onBuyNow?: (p: PublicProductLite) => void;
  rating?: number;
};

function priceToText(pr: PublicProductLite["pricing"]): string {
  const fmt = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(pr.amount);

  if (pr.mode === "one_time") return fmt;
  const interval = pr.interval === "month" ? "mois" : "an";
  return `${fmt} / ${interval}`;
}

const openAuth = (mode: "signin" | "signup" = "signin") =>
  window.dispatchEvent(
    new CustomEvent("fm:open-account", { detail: { mode } })
  );

function buildSrcSet(srcset?: Record<string, string>) {
  if (!srcset) return undefined;
  const parts = Object.entries(srcset)
    .map(([w, url]) => {
      const ww = parseInt(w, 10);
      if (!url || !Number.isFinite(ww)) return null;
      return `${url} ${ww}w`;
    })
    .filter(Boolean) as string[];

  if (parts.length === 0) return undefined;
  // ordre croissant pour être clean
  parts.sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0));
  return parts.join(", ");
}

const ProductCardPublic = memo(function ProductCardPublic({
  product,
  onAddToCart,
  onToggleFavorite,
  onBuyNow,
  rating,
}: ProductCardPublicProps) {
  const navigate = useNavigate();

  const liked = useWishlistHas(product.id);
  const inCart = useCartHas(product.id);

  const goDetails = () => navigate(publicProductUrl(product.id));

  const handleToggleFavorite = useCallback(
    (next: boolean) => {
      wishlistActions.toggle(product.id, next);
      onToggleFavorite?.(product, next);
    },
    [product, onToggleFavorite]
  );

  const handleToggleCart = useCallback(() => {
    if (inCart) {
      cartActions.setQty(product.id, 0);
    } else {
      cartActions.setQty(product.id, 1);
      onAddToCart?.(product);
    }
  }, [inCart, product, onAddToCart]);

  const handleBuyNow = useCallback(() => {
    const isLoggedIn = !!loadSession()?.token;
    if (!isLoggedIn) {
      openAuth("signin");
      return;
    }
    setCheckoutIntent([{ id: product.id, qty: 1 }]);
    grantCheckoutGate();
    onBuyNow?.(product);
    navigate("/marketplace/checkout");
  }, [navigate, product, onBuyNow]);

  const ratingValue = Number.isFinite(rating as number)
    ? (rating as number)
    : Number(product.ratingAvg ?? 0);
  const ratingCount = Number(product.ratingCount ?? 0);

  // ✅ image principale : priorité à image.src (nouveau), sinon imageUrl, sinon images[0]
  const mainSrc = useMemo(() => {
    return (
      product.image?.src ||
      product.imageUrl ||
      (Array.isArray(product.images) ? product.images[0] : "") ||
      ""
    );
  }, [product.image?.src, product.imageUrl, product.images]);

  const srcSet = useMemo(
    () => buildSrcSet(product.image?.srcset),
    [product.image?.srcset]
  );

  // grille: 1 col (mobile), 2 col (sm), 3 col (lg)
  const sizes = srcSet
    ? "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
    : undefined;

  return (
    <article
      className="relative rounded-2xl p-[2px] bg-gradient-to-tr from-violet-500/60 to-cyan-400/60"
      title={product.title}
    >
      <div className="relative overflow-hidden rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white dark:bg-neutral-900">
        <div className="relative">
          <div className="aspect-[16/10] bg-neutral-100 dark:bg-neutral-800">
            {mainSrc ? (
              <img
                src={mainSrc}
                srcSet={srcSet}
                sizes={sizes}
                alt={product.title}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
                onClick={goDetails}
              />
            ) : null}
          </div>

          {/* Badges côté gauche */}
          <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-2">
            {product.badgeEligible && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-600/95 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow ring-1 ring-white/15">
                <BadgeCheck className="w-[14px] h-[14px]" />
                <span className="leading-none">Certifié</span>
              </span>
            )}
            <RatingBadge rating={ratingValue} count={ratingCount} />
          </div>

          {/* Icônes + CTA */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            <FavoriteButton liked={liked} onToggle={handleToggleFavorite} />
            <CartButton
              active={inCart}
              ariaLabel={inCart ? "Retirer du panier" : "Ajouter au panier"}
              onClick={handleToggleCart}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBuyNow();
              }}
              className="hidden sm:inline-flex items-center rounded-full bg-violet-600 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm hover:bg-violet-500 transition"
            >
              Acheter
            </button>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-tr from-neutral-900/80 via-neutral-900/50 to-transparent">
            <div className="flex items-center justify-between px-4 py-3 text-white">
              <div className="truncate font-semibold">{product.title}</div>
              <div className="ml-4 shrink-0 text-sm font-extrabold">
                {priceToText(product.pricing)}
              </div>
            </div>
          </div>
        </div>

        {/* Clic carte = détail */}
        <button
          type="button"
          aria-label="Ouvrir le produit"
          className="absolute inset-0 z-0"
          onClick={goDetails}
        />
      </div>
    </article>
  );
});

export default ProductCardPublic;
