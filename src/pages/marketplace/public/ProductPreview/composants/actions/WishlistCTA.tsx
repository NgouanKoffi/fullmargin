import { memo, useCallback } from "react";
import { Heart } from "lucide-react";
import { useWishlistHas, wishlistActions } from "../../../../lib/wishlist";

type Props = {
  productId: string;
  className?: string;
  onAfterToggle?: (liked: boolean) => void;
};

const WishlistCTA = memo(function WishlistCTA({
  productId,
  className = "",
  onAfterToggle,
}: Props) {
  const liked = useWishlistHas(productId);

  const toggle = useCallback(() => {
    if (!productId) return;
    wishlistActions.toggle(productId, !liked);
    onAfterToggle?.(!liked);
  }, [productId, liked, onAfterToggle]);

  const base =
    "w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium active:scale-[.99] transition";
  const style = liked
    ? "bg-rose-600 hover:bg-rose-700 text-white"
    : "bg-white hover:bg-neutral-50 text-rose-600 ring-1 ring-rose-300 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-rose-400";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
      title={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`${base} ${style} ${className}`}
    >
      <Heart
        className="w-4 h-4"
        // cœur rempli quand déjà en favoris
        fill={liked ? "currentColor" : "none"}
      />
      {liked ? "Retirer des favoris" : "Ajouter aux favoris"}
    </button>
  );
});

export default WishlistCTA;
