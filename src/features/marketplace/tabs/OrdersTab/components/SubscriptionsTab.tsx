// src/pages/marketplace/tabs/OrdersTab/components/SubscriptionsTab.tsx
import type { PurchaseOrder, PurchasedProduct } from "../types";
import {
  fmtDate,
  fmtMoney,
  getLicenseBadge,
  isLicenseExpired,
  isSubscriptionLicense,
  resolveUrl,
  statusClasses,
  statusLabel,
} from "../helpers";

function SubscriptionCard({
  pid,
  product,
  fallbackTitle,
  fallbackImage,
  onRenew,
}: {
  pid: string;
  product: PurchasedProduct;
  fallbackTitle: string;
  fallbackImage: string;
  onRenew: (pid: string) => void;
}) {
  const title = (product.title || "").trim() || fallbackTitle;
  const img = resolveUrl((product.imageUrl || fallbackImage || "").trim());
  const badge = getLicenseBadge(product.license || null);
  const expired = isLicenseExpired(product.license || null);

  return (
    <li className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 p-4 bg-white/70 dark:bg-neutral-900/60 min-w-0">
      <div className="flex gap-3 min-w-0">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
          {img ? (
            <img src={img} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <div className="text-sm font-semibold break-words">{title}</div>
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

          {expired ? (
            <button
              type="button"
              onClick={() => onRenew(pid)}
              className="mt-2 inline-flex items-center justify-center text-xs font-semibold rounded-lg px-3 py-2 bg-violet-600 text-white hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              Renouveler
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default function SubscriptionsTab({
  orders,
  prodMap,
  titleFromOrders,
  imageFromOrders,
  prodsLoading,
  onRenew,
}: {
  orders: PurchaseOrder[];
  prodMap: Record<string, PurchasedProduct>;
  titleFromOrders: Record<string, string>;
  imageFromOrders: Record<string, string>;
  prodsLoading: boolean;
  onRenew: (pid: string) => void;
}) {
  const subscriptionIds = Object.keys(prodMap).filter((pid) =>
    isSubscriptionLicense(prodMap[pid]?.license || null)
  );

  const subscriptionOrders = orders.filter((o) =>
    (o.items || []).some((it) =>
      subscriptionIds.includes(String(it.product || "").trim())
    )
  );

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2 min-w-0">
        <div className="text-sm font-semibold">Mes abonnements</div>
        {prodsLoading ? (
          <div className="text-[11px] opacity-70">Chargement…</div>
        ) : null}
      </div>

      {subscriptionIds.length === 0 ? (
        <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 p-8 text-center bg-white/70 dark:bg-neutral-900/60">
          <div className="text-lg font-semibold mb-1">Aucun abonnement</div>
          <div className="text-sm opacity-70">
            Vos abonnements apparaîtront ici dès votre premier achat en
            abonnement.
          </div>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 min-w-0 mb-6">
          {subscriptionIds.map((pid) => (
            <SubscriptionCard
              key={pid}
              pid={pid}
              product={prodMap[pid]}
              fallbackTitle={titleFromOrders[pid] || `Produit ${pid.slice(-6)}`}
              fallbackImage={imageFromOrders[pid] || ""}
              onRenew={onRenew}
            />
          ))}
        </ul>
      )}

      <div className="text-sm font-semibold mb-2">Historique (abonnements)</div>

      {subscriptionOrders.length === 0 ? (
        <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 p-8 text-center bg-white/70 dark:bg-neutral-900/60">
          <div className="text-lg font-semibold mb-1">Aucun historique</div>
          <div className="text-sm opacity-70">
            Les paiements liés à vos abonnements apparaîtront ici.
          </div>
        </div>
      ) : (
        <ul className="grid gap-3 min-w-0">
          {subscriptionOrders.map((o) => (
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

                  <div className="text-xs mt-1 min-w-0">
                    Abonnement(s) :
                    <ul className="mt-1 ml-4 list-disc min-w-0">
                      {(o.items || [])
                        .filter((it) =>
                          subscriptionIds.includes(
                            String(it.product || "").trim()
                          )
                        )
                        .map((it, idx) => {
                          const pid = String(it.product || "").trim();
                          const name =
                            (it.title || "").trim() ||
                            titleFromOrders[pid] ||
                            `Produit ${pid.slice(-6)}`;
                          const lic = prodMap[pid]?.license || null;
                          const badge = getLicenseBadge(lic);
                          const expired = isLicenseExpired(lic);

                          return (
                            <li
                              key={`${pid}-${idx}`}
                              className="mt-0.5 break-words"
                            >
                              <span className="font-medium">{name}</span>{" "}
                              <span className="opacity-70">×{it.qty}</span>
                              {badge ? (
                                <span
                                  title={badge.hint || undefined}
                                  className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ring-1 whitespace-nowrap ${badge.classes}`}
                                >
                                  {badge.label}
                                </span>
                              ) : null}
                              {expired ? (
                                <button
                                  type="button"
                                  onClick={() => onRenew(pid)}
                                  className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-600 text-white hover:bg-violet-500"
                                >
                                  Renouveler
                                </button>
                              ) : null}
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                </div>

                <div className="shrink-0 text-left md:text-right">
                  <div className="text-sm font-semibold">
                    Montant : {fmtMoney(o.totalAmount, o.currency)}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
