// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\components\FavoriteButton.tsx
import { memo } from "react";
import { Heart } from "lucide-react";

export type FavoriteButtonProps = {
  liked: boolean;
  onToggle?: (next: boolean) => void;
  className?: string;
  size?: number; // px
};

const FavoriteButton = memo(function FavoriteButton({
  liked,
  onToggle,
  className = "",
  size = 18,
}: FavoriteButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.(!liked);
      }}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-rose-500 shadow-sm ring-1 ring-black/10 dark:ring-white/10 hover:bg-white active:scale-95 transition ${
        liked ? "bg-rose-50" : ""
      } ${className}`}
    >
      <Heart
        className="shrink-0"
        style={{ width: size, height: size }}
        fill={liked ? "currentColor" : "none"}
      />
    </button>
  );
});

export default FavoriteButton;
