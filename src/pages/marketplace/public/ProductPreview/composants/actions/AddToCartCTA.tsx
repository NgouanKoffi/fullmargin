import { memo, useCallback } from "react";
import { useCartHas, cartActions } from "../../../../lib/cart";

type Props = {
  productId: string;
  className?: string;
  /** callback facultatif après bascule */
  onAfterToggle?: (inCart: boolean) => void;
};

const AddToCartCTA = memo(function AddToCartCTA({
  productId,
  className = "",
  onAfterToggle,
}: Props) {
  const inCart = useCartHas(productId);

  const toggle = useCallback(() => {
    if (!productId) return;
    cartActions.setQty(productId, inCart ? 0 : 1);
    onAfterToggle?.(!inCart);
  }, [productId, inCart, onAfterToggle]);

  const base =
    "w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium active:scale-[.99] transition";
  const style = inCart
    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
    : "bg-violet-600 hover:bg-violet-700 text-white";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={inCart}
      aria-label={inCart ? "Retirer du panier" : "Ajouter au panier"}
      title={inCart ? "Retirer du panier" : "Ajouter au panier"}
      className={`${base} ${style} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4 fill-current"
        aria-hidden="true"
      >
        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.16 14h9.45c.75 0 1.4-.41 1.73-1.03l3.58-6.49a1 1 0 0 0-.88-1.48H6.21L5.27 2H2v2h2l3.6 7.59-1.35 2.45A2 2 0 0 0 6 16a2 2 0 0 0 2 2h12v-2H8.42a.25.25 0 0 1-.22-.37L9 14z" />
      </svg>
      {inCart ? "Retirer du panier" : "Ajouter au panier"}
    </button>
  );
});

export default AddToCartCTA;
