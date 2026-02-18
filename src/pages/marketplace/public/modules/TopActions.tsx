import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CartButton, FavoriteButton, CategoriesButton } from "../components/ui";

type Props = {
  wishlistCount: number;
  cartCount?: number; // 🆕 compteur panier
  onOpenDrawer: () => void;
};

export default function TopActions({
  wishlistCount,
  cartCount = 0,
  onOpenDrawer,
}: Props) {
  const navigate = useNavigate();

  const goCart = useCallback(() => {
    navigate("/marketplace/dashboard?tab=cart");
  }, [navigate]);

  const goWishlist = useCallback(() => {
    navigate("/marketplace/dashboard?tab=wishlist");
  }, [navigate]);

  return (
    <div className="flex items-center gap-2">
      {/* Panier = badge panier */}
      <CartButton count={cartCount} onClick={goCart} />
      {/* Cœur = badge wishlist */}
      <FavoriteButton count={wishlistCount} onClick={goWishlist} />
      <CategoriesButton
        className="hidden md:inline-flex"
        onClick={onOpenDrawer}
      />
    </div>
  );
}
