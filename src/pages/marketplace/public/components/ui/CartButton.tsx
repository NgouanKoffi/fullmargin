// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\components\CartButton.tsx
import { memo } from "react";
import { ShoppingCart } from "lucide-react";

export type CartButtonProps = {
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  size?: number; // px (taille de l’icône)
  active?: boolean; // true = déjà au panier → style "actif"
  count?: number; // badge éventuel (ex : top bar)
};

const CartButton = memo(function CartButton({
  onClick,
  className = "",
  ariaLabel = "Ajouter au panier",
  size = 18,
  active = false,
  count = 0,
}: CartButtonProps) {
  // même base que FavoriteButton: rounded-xl + padding
  const base =
    "relative inline-flex items-center justify-center rounded-xl px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 focus:outline-none transition";

  // 🟢 actif = vert plein (comme “confirmé”)
  // ⚪️ inactif = fond neutre + icône neutre (pas verte)
  const style = active
    ? "bg-emerald-600 hover:bg-emerald-600/90 text-white ring-emerald-600"
    : "bg-white text-neutral-900 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800";

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`${base} ${style} ${className}`}
    >
      <ShoppingCart
        className="shrink-0"
        style={{ width: size, height: size }}
      />

      {count > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] rounded-full bg-violet-600 text-white text-[11px] leading-[20px] text-center px-1"
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
});

export default CartButton;
