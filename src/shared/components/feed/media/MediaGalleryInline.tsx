// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\components\feed\media\MediaGalleryInline.tsx
import type { Media } from "../types";

export default function MediaGalleryInline({
  items,
  onOpenLightbox,
}: {
  items: Media[];
  onOpenLightbox: (startAt: number) => void;
}) {
  // si c'est juste 1 image, on laisse le parent gérer
  if (items.length === 1 && items[0].type === "image") return null;

  return (
    <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-black/5 dark:ring-white/10">
      <div className="flex gap-2 p-2 snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-pl-2">
        {items.map((m, i) => (
          <div
            key={i}
            className="relative min-w-full snap-center rounded-lg overflow-hidden bg-black/5 dark:bg-white/5"
          >
            <div className="relative w-full aspect-video">
              {m.type === "image" ? (
                <button
                  onClick={() => onOpenLightbox(i)}
                  className="absolute inset-0"
                  aria-label="Ouvrir l’image"
                >
                  <img
                    src={m.url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ) : (
                // 👇 on affiche directement la vidéo
                <video
                  src={m.url}
                  controls
                  poster={m.thumbnail || undefined}
                  className="absolute inset-0 h-full w-full object-contain bg-black"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
