import { useRef, useState, type ChangeEvent } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";

export type ImagePickSpec = {
  label: string;
  accept?: string;
  maxBytes: number;
  shape: "round" | "rect-16x9";
};

const ACCEPT_IMAGES = "image/png,image/jpeg";

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

async function fileToOptimizedDataURL(
  file: File,
  opts: { maxW?: number; maxH?: number; quality?: number } = {}
): Promise<string> {
  const maxW = opts.maxW ?? 1600;
  const maxH = opts.maxH ?? 900;
  const quality = opts.quality ?? 0.85;

  let source: CanvasImageSource = await loadImageElement(file);
  // Simplification : on utilise directement HTMLImageElement pour plus de compatibilité TS
  
  const iw = (source as HTMLImageElement).naturalWidth;
  const ih = (source as HTMLImageElement).naturalHeight;
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

  return canvas.toDataURL("image/webp", quality) || canvas.toDataURL("image/jpeg", quality);
}

type Props = {
  spec: ImagePickSpec;
  value: string | null;
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

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    if (!f) return;

    if (validateSize && !validateSize(f.size)) {
      setError("Fichier trop volumineux.");
      return;
    }
    
    setImgLoading(true);
    try {
      const dataUrl = await fileToOptimizedDataURL(f, {
        maxW: spec.shape === "round" ? 512 : 1600,
        maxH: spec.shape === "round" ? 512 : 900,
        quality: 0.85,
      });
      onChange(dataUrl);
    } catch {
      setError("Lecture du fichier impossible.");
    } finally {
      setImgLoading(false);
    }
  };

  const shapeClass =
    spec.shape === "round"
      ? "size-[148px] md:size-[164px] rounded-full"
      : "w-full max-w-3xl aspect-[16/9] rounded-xl";

  return (
    <div className="rounded-2xl border bg-white shadow-sm border-neutral-200 dark:bg-black/30 dark:border-white/10 p-4 md:p-5">
      <h3 className="mb-4 text-base font-semibold">
        {spec.label} <span className="text-red-500">*</span>
      </h3>

      <div className="flex flex-col items-center gap-4">
        <div className={`relative overflow-hidden ${shapeClass} ring-1 ring-neutral-200 border border-neutral-200 dark:ring-white/10 dark:border-white/10 bg-neutral-100 dark:bg-neutral-800/60`}>
          {imgLoading && (
            <div className="absolute inset-0 animate-pulse bg-neutral-200 dark:bg-neutral-800" />
          )}

          {value ? (
            <img
              src={value}
              alt={spec.label}
              className="absolute inset-0 w-full h-full object-cover"
              onLoad={() => setImgLoading(false)}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <ImageIcon className="size-8 text-neutral-400" />
            </div>
          )}
        </div>

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
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-white/10 dark:bg-neutral-900/60 dark:hover:bg-neutral-900 transition-colors"
          >
            <Upload className="size-4" />
            Choisir un fichier
          </button>

          {note && <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{note}</p>}
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
