// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\components\CheckoutOrderSummary.tsx
import type { CartLine, PromoMap } from "../hooks/useMarketplaceCheckout";
import { fmtMoney } from "../hooks/useMarketplaceCheckout";

type Props = {
  lines: CartLine[];
  loading: boolean;
  ownedIds: Set<string>;
  ownedTitles: string[];
  promoMap: PromoMap;
  subtotal: number;
  error: string;
};

function Shimmer() {
  return (
    <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 p-4 animate-pulse">
      <div className="h-5 w-40 rounded bg-neutral-200/70 dark:bg-neutral-800" />
      <div className="mt-3 grid gap-2">
        <div className="h-14 rounded bg-neutral-200/70 dark:bg-neutral-800" />
        <div className="h-14 rounded bg-neutral-200/70 dark:bg-neutral-800" />
      </div>
    </div>
  );
}

export default function CheckoutOrderSummary({
  lines,
  loading,
  ownedIds,
  ownedTitles,
  promoMap,
  subtotal,
  error,
}: Props) {
  return (
    <section className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 p-4 md:p-5">
      <div className="text-base font-semibold mb-3">Votre commande</div>

      {/* Message auto-achat clair et prioritaire */}
      {ownedTitles.length > 0 && (
        <div className="mb-3 rounded-lg px-3 py-2 text-sm bg-amber-100 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:ring-amber-900/60">
          Vous ne pouvez pas acheter vos propres produits :{" "}
          <b>{ownedTitles.join(", ")}</b>.
          <br />
          Retirez-les de votre sélection pour continuer.
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-lg px-3 py-2 text-sm bg-rose-100 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-900/60">
          {error}
        </div>
      )}

      {/* Bandeau informatif sur les codes promo détectés */}
      {promoMap.size > 0 && (
        <div className="mb-3 rounded-lg px-3 py-2 text-sm bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-900/40">
          Codes promo appliqués&nbsp;:
          <ul className="list-disc ml-5 mt-1">
            {Array.from(promoMap.entries()).map(([pid, code]) => {
              const line = lines.find((l) => l.product.id === pid);
              const title = line?.product?.title || pid;
              return (
                <li key={pid}>
                  <b>{code}</b> sur <i>{title}</i>
                </li>
              );
            })}
          </ul>
          <div className="mt-1 opacity-80">
            Le total final sera recalculé avec réduction lors de l’ouverture du
            paiement.
          </div>
        </div>
      )}

      {loading ? (
        <Shimmer />
      ) : (
        <>
          <ul className="grid gap-3">
            {lines.map(({ product, qty }) => (
              <li key={product.id} className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium line-clamp-2">
                    {product.title}
                  </div>
                  <div className="text-xs opacity-70">Qté: {qty}</div>
                  {promoMap.has(product.id) && (
                    <div className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      Code promo: {promoMap.get(product.id)}
                    </div>
                  )}
                  {ownedIds.has(product.id) && (
                    <div className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                      (C’est votre produit — impossible de l’acheter)
                    </div>
                  )}
                </div>
                <div className="text-sm font-semibold">
                  {fmtMoney((product.pricing?.amount || 0) * qty, "USD")}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-black/10 dark:border-white/10 pt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Sous-total</span>
              <span className="font-semibold">{fmtMoney(subtotal, "USD")}</span>
            </div>
            <div className="flex items-center justify-between text-sm opacity-70">
              <span>Frais</span>
              <span>—</span>
            </div>
            <div className="flex items-center justify-between text-base font-extrabold mt-2">
              <span>Total</span>
              <span className="text-rose-600">{fmtMoney(subtotal, "USD")}</span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
