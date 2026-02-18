// src/pages/marketplace/tabs/OrdersTab/components/OrdersReceiptsList.tsx
import type { PurchaseOrder } from "../types";
import {
  fmtDate,
  fmtMoney,
  isLinePromo,
  statusClasses,
  statusLabel,
} from "../helpers";

export default function OrdersReceiptsList({
  orders,
}: {
  orders: PurchaseOrder[];
}) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 p-8 text-center bg-white/70 dark:bg-neutral-900/60">
        <div className="text-lg font-semibold mb-1">Aucun achat</div>
        <div className="text-sm opacity-70">Vos achats apparaîtront ici.</div>
      </div>
    );
  }

  return (
    <ul className="grid gap-3 min-w-0">
      {orders.map((o) => {
        const codes = Array.from(
          new Set(
            (o.appliedPromos || [])
              .map((ap) => (ap?.code || "").trim())
              .filter(Boolean)
          )
        );

        return (
          <li
            key={o.id}
            className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 p-4 min-w-0"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold">
                    Commande #{o.id.slice(-6)}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full ring-1 ${
                      statusClasses[o.status] || statusClasses.processing
                    }`}
                  >
                    {statusLabel[o.status] || o.status}
                  </span>
                </div>

                <div className="text-xs opacity-70 mt-0.5">
                  Créée : {fmtDate(o.createdAt)}{" "}
                  {o.paidAt ? `· Payée : ${fmtDate(o.paidAt)}` : ""}
                </div>

                <div className="text-xs mt-0.5 break-words">
                  Référence paiement :{" "}
                  <span className="font-medium">
                    {o.paymentReference || "—"}
                  </span>
                </div>

                <div className="text-xs mt-1 min-w-0">
                  Produit(s) :
                  <ul className="mt-1 ml-4 list-disc min-w-0">
                    {(o.items || []).map((it, idx) => {
                      const name =
                        it.title || `Produit ${String(it.product).slice(-6)}`;
                      const promoUsed = isLinePromo(it);
                      const code = (it.promoCode || "").trim();

                      const original =
                        typeof it.originalUnitAmount === "number"
                          ? it.originalUnitAmount
                          : undefined;

                      const final =
                        typeof it.finalUnitAmount === "number"
                          ? it.finalUnitAmount
                          : it.unitAmount;

                      return (
                        <li
                          key={`${it.product}-${idx}`}
                          className="mt-0.5 break-words"
                        >
                          <span className="font-medium">{name}</span>{" "}
                          <span className="opacity-70">×{it.qty}</span>
                          {promoUsed && (
                            <span className="ml-2 inline-flex flex-wrap items-center gap-1 text-[10px] font-semibold rounded px-1.5 py-0.5 ring-1 ring-emerald-300/70 text-emerald-800 dark:text-emerald-300 dark:ring-emerald-800/70 bg-emerald-50 dark:bg-emerald-900/20">
                              {code ? `Code : ${code}` : "Promo appliquée"}
                              {original != null &&
                                final != null &&
                                original > final && (
                                  <span className="ml-1 opacity-75">
                                    (<s>{fmtMoney(original, o.currency)}</s> →{" "}
                                    {fmtMoney(final, o.currency)})
                                  </span>
                                )}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {codes.length > 0 && (
                  <div className="text-[11px] mt-1 opacity-80 break-words">
                    Codes promo (commande) :{" "}
                    <span className="font-semibold">{codes.join(", ")}</span>
                  </div>
                )}
              </div>

              <div className="shrink-0 text-left md:text-right">
                <div className="text-sm font-semibold">
                  Montant : {fmtMoney(o.totalAmount, o.currency)}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
