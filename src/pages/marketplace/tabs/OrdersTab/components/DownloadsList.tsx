// src/pages/marketplace/tabs/OrdersTab/components/DownloadsList.tsx
import type { PurchasedProduct } from "../types";
import DownloadCard from "./DownloadCard";

export default function DownloadsList({
  purchasedProductIds,
  prodMap,
  titleFromOrders,
  imageFromOrders,
  downloadingId,
  onDownload,
  onRenew,
  prodsLoading,
}: {
  purchasedProductIds: string[];
  prodMap: Record<string, PurchasedProduct>;
  titleFromOrders: Record<string, string>;
  imageFromOrders: Record<string, string>;
  downloadingId: string;
  onDownload: (pid: string, fileName?: string) => void;
  onRenew: (pid: string) => void;
  prodsLoading: boolean;
}) {
  return (
    <>
      {prodsLoading && (
        <div className="grid gap-3 mb-2 min-w-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/40 animate-pulse"
            />
          ))}
        </div>
      )}

      {purchasedProductIds.length === 0 ? (
        <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 p-8 text-center bg-white/70 dark:bg-neutral-900/60">
          <div className="text-lg font-semibold mb-1">
            Aucun produit téléchargeable
          </div>
          <div className="text-sm opacity-70">
            Vos achats “Payée/En cours” apparaîtront ici.
          </div>
        </div>
      ) : (
        <ul className="grid gap-3 min-w-0">
          {purchasedProductIds.map((pid) => {
            const p = prodMap[pid] || { id: pid };
            const titleFallback =
              titleFromOrders[pid] || `Produit ${pid.slice(-6)}`;
            const imageFallback = imageFromOrders[pid] || "";

            return (
              <DownloadCard
                key={pid}
                pid={pid}
                product={p}
                titleFallback={titleFallback}
                imageFallback={imageFallback}
                downloading={downloadingId === pid}
                onDownload={() => onDownload(pid, p.fileName)}
                onRenew={() => onRenew(pid)}
              />
            );
          })}
        </ul>
      )}
    </>
  );
}
