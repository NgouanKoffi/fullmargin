// src/pages/marketplace/public/components/PromoCodeBox.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BadgePercent, CheckCircle2, Loader2, X, XCircle } from "lucide-react";
import {
  validatePublicPromo,
  applyPromoToPricing,
} from "../../lib/publicShopApi";
import type { Pricing, PromoValidateRes } from "../../lib/publicShopApi";

/** Résultat minimal renvoyé au parent */
export type PromoApplyResult = {
  code: string;
  valid: boolean;
  discount: number; // montant de la remise (toujours en unité monétaire)
  final: Pricing; // pricing final à utiliser pour le paiement/affichage
  raw?: PromoValidateRes; // payload complet si besoin
};

type Props = {
  /** ID du produit en cours d’achat */
  productId: string;
  /** Prix de base affiché actuellement (servira aussi en fallback/clear) */
  pricing: Pricing;
  /** Formateur monétaire (ex: (n)=> Intl.NumberFormat(...).format(n) ) */
  money: (n: number) => string;
  /** Valeur initiale (ex: querystring ?code=) */
  defaultCode?: string;
  /** Désactiver la saisie (si en cours de paiement…) */
  disabled?: boolean;
  /** Classe custom container */
  className?: string;
  /** Callback quand un code est appliqué avec succès */
  onApplied?: (res: PromoApplyResult) => void;
  /** Callback quand on supprime/annule le code */
  onCleared?: (finalPricing: Pricing) => void;
};

export default function PromoCodeBox({
  productId,
  pricing,
  money,
  defaultCode = "",
  disabled = false,
  className = "",
  onApplied,
  onCleared,
}: Props) {
  const [code, setCode] = useState(defaultCode);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<PromoApplyResult | null>(null);

  // valeur de base stable pour les dépendances
  const baseAmount = useMemo(() => pricing.amount, [pricing]);

  // reset si produit / pricing changent
  useEffect(() => {
    setError(null);
    setApplied(null);
  }, [productId, pricing.mode, baseAmount]);

  const canSubmit = useMemo(
    () => !!code.trim() && !checking && !disabled,
    [code, checking, disabled]
  );

  const clear = useCallback(() => {
    setApplied(null);
    setError(null);
    if (onCleared) onCleared(pricing);
  }, [pricing, onCleared]);

  const submit = useCallback(async () => {
    const c = code.trim();
    if (!c || checking || disabled) return;
    setChecking(true);
    setError(null);

    try {
      const res = await validatePublicPromo(c, productId);

      if (!res.ok) {
        setApplied(null);
        setError(res.error || "Validation impossible.");
        return;
      }

      if (!res.data.valid) {
        setApplied(null);
        setError(res.data.reason || "Code invalide ou expiré.");
        return;
      }

      const { final, discount } = applyPromoToPricing(pricing, res);

      const pack: PromoApplyResult = {
        code: c,
        valid: true,
        final,
        discount,
        raw: res,
      };
      setApplied(pack);
      if (onApplied) onApplied(pack);
    } catch {
      setApplied(null);
      setError("Erreur réseau pendant la validation.");
    } finally {
      setChecking(false);
    }
  }, [code, checking, disabled, pricing, productId, onApplied]);

  // Soumission avec Entrée
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canSubmit) {
      e.preventDefault();
      submit();
    }
  };

  // Prix affiché
  const originalAmount = baseAmount;
  const finalAmount = applied?.final.amount ?? originalAmount;
  const discountAmount = applied?.discount ?? 0;

  return (
    <div
      className={
        "rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 p-4 sm:p-5 " +
        className
      }
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
          <BadgePercent className="h-4 w-4" />
        </div>
        <div className="font-semibold">Code promo</div>
        {applied ? (
          <span className="ml-auto inline-flex items-center gap-1 text-emerald-600 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Appliqué
          </span>
        ) : null}
      </div>

      {/* ⬇️ ICI : colonne sur mobile, ligne à partir de sm */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative flex-1 w-full">
          <input
            value={code}
            onChange={(ev) => setCode(ev.target.value.toUpperCase())}
            onKeyDown={onKeyDown}
            placeholder="Saisir votre code"
            maxLength={40}
            disabled={disabled || checking || !!applied}
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10"
          />
          {code && !applied && !checking ? (
            <button
              title="Effacer"
              onClick={() => setCode("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="h-4 w-4 opacity-70" />
            </button>
          ) : null}
        </div>

        {applied ? (
          <button
            onClick={clear}
            className="w-full sm:w-auto inline-flex items-center gap-2 h-10 rounded-xl px-3 text-sm ring-1 ring-black/10 dark:ring-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            Retirer
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!canSubmit}
            className={`w-full sm:w-auto inline-flex items-center gap-2 h-10 rounded-xl px-3 text-sm font-semibold
              ${
                canSubmit
                  ? "bg-neutral-900 text-white hover:bg-black"
                  : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed"
              }`}
          >
            {checking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Vérification…
              </>
            ) : (
              <>Appliquer</>
            )}
          </button>
        )}
      </div>

      {error ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-rose-600">
          <XCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between">
          <span className="opacity-70">Prix initial</span>
          <span className={applied ? "line-through opacity-60" : ""}>
            {money(originalAmount)}
          </span>
        </div>

        {applied ? (
          <>
            <div className="flex justify-between">
              <span className="opacity-70">Remise</span>
              <span>-{money(discountAmount)}</span>
            </div>
            <div className="flex justify-between sm:col-span-2 font-medium">
              <span>Total</span>
              <span>{money(finalAmount)}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between sm:col-span-2 font-medium">
            <span>Total</span>
            <span>{money(originalAmount)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
