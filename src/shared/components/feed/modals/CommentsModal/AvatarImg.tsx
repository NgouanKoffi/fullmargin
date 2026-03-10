// src/pages/communaute/public/components/feed/modals/comments/AvatarImg.tsx
import { AVATAR_FALLBACK } from "./commentUtils";

export default function AvatarImg({
  src,
  alt = "",
  className = "h-9 w-9 rounded-full object-cover",
}: {
  src?: string | null;
  alt?: string;
  className?: string;
}) {
  const safe = src && src.trim() ? src : AVATAR_FALLBACK;
  return (
    <img
      src={safe}
      alt={alt}
      className={className}
      onError={(e) => {
        const el = e.currentTarget as HTMLImageElement;
        if (el.src !== AVATAR_FALLBACK) el.src = AVATAR_FALLBACK;
      }}
    />
  );
}
