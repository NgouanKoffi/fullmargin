// src/pages/marketplace/tabs/shop/components/ImagePicker.tsx
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { ACCEPT_IMAGES, cardBase } from "../constants";
import type { ImagePickSpec } from "../types";

/* ──────────────────────────────────────────────────────────
   Helpers typés (pas de any)
────────────────────────────────────────────────────────── */

function isImageBitmap(x: unknown): x is ImageBitmap {
  return typeof ImageBitmap !== "undefined" && x instanceof ImageBitmap;
}

function isHTMLImageElement(x: unknown): x is HTMLImageElement {
  return (
    typeof HTMLImageElement !== "undefined" && x instanceof HTMLImageElement
  );
}

function getDims(src: CanvasImageSource): { w: number; h: number } {
  if (isImageBitmap(src)) return { w: src.width, h: src.height };
  if (isHTMLImageElement(src))
    return { w: src.naturalWidth, h: src.naturalHeight };
  // autres CanvasImageSource (SVGImageElement, OffscreenCanvas, etc.) – fallback
  // @ts-expect-error largeur/hauteur non garanties mais gérées à l’exécution
  const w: number = src.width ?? 0;
  // @ts-expect-error idem
  const h: number = src.height ?? 0;
  return { w, h };
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load"));
    };
    img.src = url;
  });
}

/** Redimensionne/compresse en DataURL (WebP si possible, sinon JPEG) */
async function fileToOptimizedDataURL(
  file: File,
  opts: { maxW?: number; maxH?: number; quality?: number } = {}
): Promise<string> {
  const maxW = opts.maxW ?? 1600;
  const maxH = opts.maxH ?? 900;
  const quality = opts.quality ?? 0.85;

  let source: CanvasImageSource;

  if ("createImageBitmap" in window) {
    try {
      const bmp = await createImageBitmap(file);
      source = bmp;
    } catch {
      // fallback si createImageBitmap échoue (formats exotiques)
      source = await loadImageElement(file);
    }
  } else {
    source = await loadImageElement(file);
  }

  const { w: iw, h: ih } = getDims(source);
  const ratio = iw > 0 && ih > 0 ? iw / ih : 1;

  let tw = iw;
  let th = ih;
  if (tw > maxW) {
    tw = maxW;
    th = Math.round(tw / ratio);
  }
  if (th > maxH) {
    th = maxH;
    tw = Math.round(th * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, tw);
  canvas.height = Math.max(1, th);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  const prefer = "image/webp";
  const dataUrl =
    canvas.toDataURL(prefer, quality) ||
    canvas.toDataURL("image/jpeg", quality);
  return dataUrl;
}

/* ──────────────────────────────────────────────────────────
   Composant
────────────────────────────────────────────────────────── */

type Props = {
  spec: ImagePickSpec;
  value: string | null; // DataURL or URL
  onChange: (dataUrl: string | null) => void;
  note?: string;
  acceptOverride?: string;
  validateSize?: (size: number) => boolean;
};

export default function ImagePicker({
  spec,
  value,
  onChange,
  note,
  acceptOverride,
  validateSize,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);

  useEffect(() => {
    if (value) setImgLoading(true);
  }, [value]);

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    if (!f) return;

    if (validateSize && !validateSize(f.size)) {
      setError("Fichier trop volumineux.");
      onChange(null);
      return;
    }
    try {
      const dataUrl = await fileToOptimizedDataURL(f, {
        maxW: spec.shape === "round" ? 512 : 1600,
        maxH: spec.shape === "round" ? 512 : 900,
        quality: 0.85,
      });
      onChange(dataUrl);
    } catch {
      setError("Lecture du fichier impossible.");
      onChange(null);
    }
  };

  const shapeClass =
    spec.shape === "round"
      ? "size-[148px] md:size-[164px] rounded-full"
      : "w-full max-w-3xl aspect-[16/9] rounded-xl";

  return (
    <section className={cardBase}>
      <h3 className="mb-4 text-base font-semibold">
        {spec.label} <span className="text-red-500">*</span>
      </h3>

      <div className="flex flex-col items-center gap-4">
        {/* Cadre image */}
        <div
          className={`relative overflow-hidden ${shapeClass}
            ring-1 ring-neutral-200 border border-neutral-200
            dark:ring-white/10 dark:border-white/10
            bg-neutral-100 dark:bg-neutral-800/60`}
        >
          {imgLoading && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800" />
          )}

          {value ? (
            <img
              key={value}
              src={value}
              alt={`Aperçu ${spec.label}`}
              className="absolute inset-0 w-full h-full object-cover object-center block"
              onLoad={() => setImgLoading(false)}
              onError={() => setImgLoading(false)}
              loading="eager"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <ImageIcon className="size-8 text-neutral-400" />
            </div>
          )}
        </div>

        {/* Bouton */}
        <div className="text-center">
          <input
            ref={inputRef}
            type="file"
            accept={acceptOverride ?? ACCEPT_IMAGES}
            className="hidden"
            onChange={onPick}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium shadow-sm
                       hover:bg-neutral-50 active:scale-[.99]
                       dark:border-white/10 dark:bg-neutral-900/60 dark:hover:bg-neutral-900"
          >
            <Upload className="size-4" />
            Choisir un fichier
          </button>

          {note && (
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              {note}
            </p>
          )}
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </section>
  );
}
