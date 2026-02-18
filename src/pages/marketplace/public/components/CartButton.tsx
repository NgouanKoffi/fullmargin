// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\components\CartButton.tsx
import { memo } from "react";
import { ShoppingCart } from "lucide-react";

export type CartButtonProps = {
  /** true = déjà au panier → style “actif” */
  active?: boolean;
  onClick?: () => void;
  className?: string;
  /** si non fourni, on déduit depuis `active` */
  ariaLabel?: string;
  size?: number; // px
};

const CartButton = memo(function CartButton({
  active = false,
  onClick,
  className = "",
  ariaLabel,
  size = 18,
}: CartButtonProps) {
  const label =
    ariaLabel ?? (active ? "Retirer du panier" : "Ajouter au panier");

  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      data-active={active ? "true" : "false"}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-full shadow-sm ring-1 transition",
        active
          ? "bg-emerald-600 text-white ring-emerald-600 hover:bg-emerald-600/90"
          : "bg-white/95 text-emerald-600 ring-black/10 dark:ring-white/10 hover:bg-white",
        className,
      ].join(" ")}
    >
      <ShoppingCart
        className="shrink-0"
        style={{ width: size, height: size }}
      />
    </button>
  );
});

export default CartButton;
