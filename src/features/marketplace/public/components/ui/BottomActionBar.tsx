// src/pages/marketplace/public/components/ui/BottomActionBar.tsx
import { useCallback } from "react";
import CartButton from "./CartButton";
import FavoriteButton from "./FavoriteButton";
import CategoriesButton from "./CategoriesButton";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type BottomActionBarProps = {
  cartCount?: number;
  wishlistCount?: number;
  onWishlist?: () => void;
  onCart?: () => void;
  onExplore?: () => void;
  className?: string;
};

export default function BottomActionBar({
  cartCount = 0,
  wishlistCount = 0,
  onWishlist,
  onCart,
  onExplore,
  className = "",
}: BottomActionBarProps) {
  const navigate = useNavigate();

  const goBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/marketplace");
  }, [navigate]);

  const wishlist = useCallback(() => onWishlist?.(), [onWishlist]);
  const cart = useCallback(() => onCart?.(), [onCart]);
  const explore = useCallback(() => onExplore?.(), [onExplore]);

  return (
    <div
      className={[
        "fixed inset-x-0",
        "bottom-[max(0.75rem,env(safe-area-inset-bottom))]",
        "z-[100]",
        "flex items-center justify-center",
        className,
      ].join(" ")}
    >
      <div
        className="
          pointer-events-auto mx-auto max-w-6xl
          grid grid-cols-4 gap-2 rounded-2xl px-2 py-2
          shadow-lg shadow-black/5
          ring-1 ring-black/10 dark:ring-white/10
          bg-white/95 dark:bg-neutral-900/90 backdrop-blur
        "
      >
        {/* --- Retour : même style que FavoriteButton (variant subtle) --- */}
        <div className="relative">
          <button
            type="button"
            onClick={goBack}
            aria-label="Retour"
            className="
              relative inline-flex items-center justify-center
              rounded-xl px-3 py-2
              ring-1 ring-black/10 dark:ring-white/10
              bg-white text-neutral-900 hover:bg-neutral-50
              dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800
              focus:outline-none transition
            "
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
          </button>
        </div>

        {/* --- Favoris + badge --- */}
        <div className="relative">
          <FavoriteButton
            onClick={wishlist}
            aria-label="Favoris"
            className="!rounded-xl"
          />
          {wishlistCount > 0 && (
            <span
              className="
                absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px]
                rounded-full bg-rose-600 text-white text-[11px]
                leading-[20px] text-center px-1
              "
              aria-hidden="true"
            >
              {wishlistCount}
            </span>
          )}
        </div>

        {/* --- Panier + badge --- */}
        <div className="relative">
          <CartButton
            onClick={cart}
            ariaLabel="Panier"
            className="!rounded-xl"
          />
          {cartCount > 0 && (
            <span
              className="
                absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px]
                rounded-full bg-violet-600 text-white text-[11px]
                leading-[20px] text-center px-1
              "
              aria-hidden="true"
            >
              {cartCount}
            </span>
          )}
        </div>

        {/* --- Explorer (Drawer catégories) --- */}
        <div className="relative">
          <CategoriesButton
            onClick={explore}
            aria-label="Explorer"
            className="!rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}
