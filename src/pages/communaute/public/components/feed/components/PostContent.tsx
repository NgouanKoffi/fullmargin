// src/pages/communaute/public/components/feed/components/PostContent.tsx
import { useMemo, useState } from "react";
import MediaGalleryInline from "../media/MediaGalleryInline";
import type { PostLite } from "../types";
import { clampText } from "../utils";

function looksLikeHtml(str: string | null | undefined): boolean {
  if (!str) return false;
  return /<\/?[a-z][\s\S]*>/i.test(str.trim());
}

type PostContentProps = {
  post: PostLite;
  onOpenLightbox?: (index: number) => void;
  /** nombre de caractères avant d’afficher “Voir plus” */
  clampLength?: number;
};

export default function PostContent({
  post,
  onOpenLightbox,
  clampLength = 420, // 🔧 tu peux changer ce seuil
}: PostContentProps) {
  const content = post.content ?? "";
  const isHtml = looksLikeHtml(content);

  const [expanded, setExpanded] = useState(false);

  // on ne clamp que le texte brut, pas le HTML
  const clamped = useMemo(
    () => clampText(content, clampLength),
    [content, clampLength]
  );

  // 👉 on sécurise media
  const media = Array.isArray(post.media) ? post.media : [];
  const hasMedia = media.length > 0;
  const singleImage =
    hasMedia && media.length === 1 && media[0]?.type === "image";

  const handleOpenLightbox = (index: number) => {
    if (onOpenLightbox) onOpenLightbox(index);
  };

  return (
    <>
      {/* ====== TEXTE / HTML ====== */}
      {content ? (
        <div className="mt-3">
          <div className="mx-auto max-w-3xl">
            {isHtml ? (
              // 🔸 si c’est du HTML (éditeur riche), on montre tout
              <div
                className="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-img:rounded-lg prose-headings:scroll-mt-20"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <>
                <p className="text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                  {expanded || !clamped.clamped
                    ? content // texte complet
                    : clamped.short}{" "}
                  {/* texte coupé */}
                </p>

                {clamped.clamped && (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-1 inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                  >
                    {expanded ? "Réduire" : "Voir plus"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* ====== MÉDIAS ====== */}
      {singleImage ? (
        <div className="mt-3">
          <button
            onClick={() => handleOpenLightbox(0)}
            className="block w-full overflow-hidden rounded-xl ring-1 ring-black/5 dark:ring-white/10"
            aria-label="Ouvrir l’image"
          >
            <div className="relative w-full aspect-video bg-black/5 dark:bg-white/5">
              <img
                src={media[0]!.url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </button>
        </div>
      ) : hasMedia ? (
        <MediaGalleryInline items={media} onOpenLightbox={handleOpenLightbox} />
      ) : null}
    </>
  );
}
