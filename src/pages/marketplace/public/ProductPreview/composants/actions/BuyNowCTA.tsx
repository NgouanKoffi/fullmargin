// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\ProductPreview\composants\actions\BuyNowCTA.tsx
import { memo } from "react";
import { ShoppingBag } from "lucide-react";

type Props = {
  onClick?: () => void;
  className?: string;
};

const BuyNowCTA = memo(function BuyNowCTA({ onClick, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Acheter maintenant"
      title="Acheter maintenant"
      className={`w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 active:scale-[.99] ${className}`}
    >
      <ShoppingBag className="w-4 h-4" />
      Acheter
    </button>
  );
});

export default BuyNowCTA;
