// src/pages/marketplace/tabs/products/AddForm/PricingSection.tsx
import { useEffect, useMemo } from "react";
import type { Pricing } from "../types";
import {
  Card,
  CardHeader,
  ErrorLine,
  InputNumber,
  Label,
  SegBtn,
  Select,
} from "./ui";

const MIN_PAID_AMOUNT = 1; // 💰 montant minimum autorisé (hors gratuit)

export default function PricingSection({
  pricing,
  onChangePricing,
  error,
  allowSubscription = true, // ✅ NEW
}: {
  pricing: Pricing;
  onChangePricing: (p: Pricing) => void;
  error?: string;
  allowSubscription?: boolean; // ✅ NEW
}) {
  // ✅ si abonnement interdit, on force one_time (sécurité)
  useEffect(() => {
    if (!allowSubscription && pricing.mode === "subscription") {
      onChangePricing({
        mode: "one_time",
        amount: pricing.amount ?? 0,
      });
    }
  }, [allowSubscription, pricing, onChangePricing]);

  // ✅ isSub ne doit être vrai QUE si autorisé
  const isSub = allowSubscription && pricing.mode === "subscription";

  const control = useMemo(
    () => (
      <div className="space-y-4">
        {/* Mode de tarification */}
        <div>
          <Label>Mode de tarification</Label>

          <div className="mt-1 inline-flex rounded-xl ring-1 ring-black/10 dark:ring-white/10 p-1 bg-white/70 dark:bg-neutral-900/60">
            {/* Paiement unique */}
            <SegBtn
              active={!isSub} // ✅ active si pas subscription (ou non autorisé)
              onClick={() =>
                onChangePricing({
                  mode: "one_time",
                  amount: pricing.mode === "one_time" ? pricing.amount : 0,
                })
              }
            >
              Paiement unique
            </SegBtn>

            {/* Abonnement (uniquement robots) */}
            {allowSubscription ? (
              <SegBtn
                active={pricing.mode === "subscription"}
                onClick={() =>
                  onChangePricing({
                    mode: "subscription",
                    amount:
                      pricing.mode === "subscription" ? pricing.amount : 0,
                    interval:
                      pricing.mode === "subscription"
                        ? pricing.interval
                        : "month",
                  })
                }
              >
                Abonnement
              </SegBtn>
            ) : null}
          </div>

          {!allowSubscription ? (
            <p className="mt-2 text-xs text-neutral-500">
              L’option <b>Abonnement</b> est disponible uniquement pour les{" "}
              <b>robots</b>.
            </p>
          ) : null}
        </div>

        {/* Montant */}
        <div>
          <div className="flex items-center justify-between gap-3">
            <Label>Montant ($)</Label>

            {/* Bouton pour rendre le produit gratuit */}
            <button
              type="button"
              onClick={() => {
                // ✅ si abo non autorisé → one_time
                if (!allowSubscription) {
                  onChangePricing({ mode: "one_time", amount: 0 });
                  return;
                }

                if (pricing.mode === "subscription") {
                  onChangePricing({
                    mode: "subscription",
                    amount: 0,
                    interval: pricing.interval,
                  });
                } else {
                  onChangePricing({
                    mode: "one_time",
                    amount: 0,
                  });
                }
              }}
              className="text-xs font-medium px-2 py-1 rounded-lg border border-emerald-500/60 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              Rendre gratuit
            </button>
          </div>

          <InputNumber
            value={pricing.amount ?? 0}
            onChange={(val) => {
              let amount =
                typeof val === "number" && !Number.isNaN(val) ? val : 0;

              // 🔒 minimum exigé dès qu'on sort du gratuit
              if (amount > 0 && amount < MIN_PAID_AMOUNT) {
                amount = MIN_PAID_AMOUNT;
              }

              // ✅ si abo non autorisé → one_time
              if (!allowSubscription) {
                onChangePricing({ mode: "one_time", amount });
                return;
              }

              if (pricing.mode === "subscription") {
                onChangePricing({
                  mode: "subscription",
                  amount,
                  interval: pricing.interval, // obligatoire en mode abo
                });
              } else {
                onChangePricing({
                  mode: "one_time",
                  amount,
                });
              }
            }}
            min={0} // 0 reste autorisé → produit gratuit
            step="0.01"
            placeholder="0.00"
          />

          <p className="mt-2 text-xs text-neutral-500">
            Montant minimum :{" "}
            <span className="font-semibold">
              {MIN_PAID_AMOUNT.toFixed(2)} $
            </span>{" "}
            pour un produit payant. Clique sur{" "}
            <span className="font-semibold">« Rendre gratuit »</span> ou mets{" "}
            <span className="font-semibold">0</span> pour un produit gratuit.
          </p>
        </div>

        {/* Intervalle si abonnement */}
        {isSub && (
          <div>
            <Label>Intervalle</Label>
            <Select
              value={pricing.interval}
              onChange={(v) => {
                if (pricing.mode !== "subscription") return;
                onChangePricing({
                  mode: "subscription",
                  amount: pricing.amount,
                  interval: v as "month" | "year",
                });
              }}
              options={[
                { value: "month", label: "Mensuel" },
                { value: "year", label: "Annuel" },
              ]}
            />
          </div>
        )}
      </div>
    ),
    [pricing, onChangePricing, isSub, allowSubscription]
  );

  return (
    <Card>
      <CardHeader
        title="Tarification"
        subtitle="Choisis le modèle et le montant"
      />

      <div className="mt-4">{control}</div>

      {/* Ligne d'erreur éventuelle */}
      <ErrorLine text={error} />

      {/* 🔥 Certification + lien charte vendeur */}
      <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10">
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          En continuant, je certifie que ce produit m'appartient et respecte la{" "}
          <a
            href="https://fullmargin.net/charte-vendeur"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 dark:text-violet-400 underline font-medium hover:text-violet-700 dark:hover:text-violet-300"
          >
            charte Vendeur de Fullmargin
          </a>
          .
        </p>
      </div>
    </Card>
  );
}
