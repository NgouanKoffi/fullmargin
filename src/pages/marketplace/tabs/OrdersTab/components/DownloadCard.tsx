// src/pages/marketplace/tabs/OrdersTab/components/DownloadCard.tsx
import type { PurchasedProduct } from "../types";
import { dbg, getLicenseBadge, isLicenseExpired, resolveUrl } from "../helpers";

export default function DownloadCard({
  pid,
  product,
  titleFallback,
  imageFallback,
  downloading,
  onDownload,
  onRenew,
}: {
  pid: string;
  product: PurchasedProduct;
  titleFallback: string;
  imageFallback: string;
  downloading: boolean;
  onDownload: () => void;
  onRenew: () => void;
}) {
  const title = (product.title || "").trim() || titleFallback;
  const rawImg = (product.imageUrl || imageFallback || "").trim();
  const img = resolveUrl(rawImg);

  const downloadable = !!(product.fileUrl && String(product.fileUrl).trim());

  const badge = getLicenseBadge(product.license || null);
  const expired = isLicenseExpired(product.license || null);

  return (
    <li className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 p-4 bg-white/70 dark:bg-neutral-900/60 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 min-w-0">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
          {img ? (
            <img
              src={img}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                dbg("IMG ERROR:", pid, img);
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <div className="text-sm font-semibold break-words min-w-0">
              {title}
            </div>

            {badge && (
              <span
                title={badge.hint || undefined}
                className={`text-[11px] px-2 py-0.5 rounded-full ring-1 whitespace-nowrap ${badge.classes}`}
              >
                {badge.label}
              </span>
            )}
          </div>

          {badge?.hint ? (
            <div className="text-[11px] mt-0.5 opacity-75">{badge.hint}</div>
          ) : null}

          {(product.fileName || product.fileMime) && (
            <div className="text-xs opacity-60 mt-1 min-w-0">
              Fichier :{" "}
              <span className="font-medium break-all">
                {product.fileName || "—"}
              </span>
              {product.fileMime ? ` · ${product.fileMime}` : ""}
            </div>
          )}

          {!downloadable && (
            <div className="text-[11px] mt-1 text-amber-700 dark:text-amber-300">
              Produit trouvé mais fichier absent.
            </div>
          )}
        </div>

        <div className="w-full sm:w-[190px] flex flex-col gap-2 sm:shrink-0">
          {expired && (
            <button
              type="button"
              onClick={onRenew}
              className="w-full inline-flex items-center justify-center gap-1 text-xs font-semibold rounded-lg px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 bg-violet-600 text-white hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              title="Renouveler la licence"
            >
              Renouveler
            </button>
          )}

          <button
            type="button"
            onClick={onDownload}
            disabled={downloading || !downloadable}
            title={product.fileName || "Télécharger"}
            className="w-full inline-flex items-center justify-center gap-2 text-xs font-medium rounded-lg px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {downloading
              ? "Téléchargement…"
              : !downloadable
              ? "Indisponible"
              : "Télécharger"}
          </button>
        </div>
      </div>
    </li>
  );
}
