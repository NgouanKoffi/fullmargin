// src/pages/communaute/public/community-details/tabs/Formations/steps/Step3Tarifs.tsx
import type React from "react";
import type { CourseDraft } from "../types";
import { Loader2 } from "lucide-react";

type Props = {
  data: CourseDraft;
  onChange: (patch: Partial<CourseDraft>) => void;
  onSubmit: () => void; // bouton final
  /** Ancien flag, on le garde pour compat mais on ne le bloque plus avec ça */
  canSubmit: boolean;
  /** Afficher "Mettre à jour" quand on édite une formation existante */
  isEdit?: boolean;
  /** Afficher un loader sur le bouton pendant l'enregistrement */
  isSubmitting?: boolean;

  /** ✅ Progress visuelle pendant l'envoi (0-100) */
  submitProgress?: number | null;
  /** ✅ Message d'étape: Préparation / Envoi / Finalisation */
  submitStage?: string | null;
};

// ✅ Min très bas pour tes tests
const MIN_PRICE = 20;

export default function Step3Tarif({
  data,
  onChange,
  onSubmit,
  isEdit,
  isSubmitting = false,
  submitProgress = null,
  submitStage = null,
}: Props) {
  const visibility = data.visibility ?? "public";

  const toFree = () =>
    onChange({ priceType: "free", price: 0, currency: data.currency ?? "USD" });

  const toPaid = () =>
    onChange({
      priceType: "paid",
      price:
        typeof data.price === "number" &&
        Number.isFinite(data.price) &&
        data.price >= MIN_PRICE
          ? data.price
          : MIN_PRICE,
      currency: data.currency ?? "USD",
    });

  const price =
    typeof data.price === "number" && Number.isFinite(data.price)
      ? data.price
      : 0;

  const priceIsValid =
    data.priceType === "free" ||
    (data.priceType === "paid" && Number.isFinite(price) && price >= MIN_PRICE);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    onChange({
      price: Number.isNaN(v) ? 0 : v,
    });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ currency: e.target.value as CourseDraft["currency"] });
  };

  const isPaid = data.priceType === "paid";

  const buttonDisabled = !priceIsValid || isSubmitting;

  const buttonLabel = isSubmitting
    ? isEdit
      ? "Mise à jour…"
      : "Création…"
    : isEdit
    ? "Mettre à jour"
    : "Créer la formation";

  const percent =
    typeof submitProgress === "number" && Number.isFinite(submitProgress)
      ? Math.max(0, Math.min(100, Math.round(submitProgress)))
      : null;

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      <header className="space-y-1">
        <h3 className="text-base sm:text-lg font-semibold">
          Monétisation & visibilité
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Choisis si ta formation est gratuite ou payante, puis décide si elle
          est visible publiquement ou réservée aux membres de la communauté.
        </p>
      </header>

      <div className="rounded-2xl p-4 sm:p-6 ring-1 ring-slate-200 dark:ring-slate-700 bg-white/80 dark:bg-slate-900/70 space-y-6 shadow-sm">
        {/* Visibilité */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Visibilité</label>
          <div className="inline-flex rounded-full bg-slate-100/80 dark:bg-slate-800/80 p-1 ring-1 ring-slate-200/70 dark:ring-slate-700/70">
            <button
              type="button"
              onClick={() => onChange({ visibility: "public" })}
              className={
                "px-4 sm:px-5 py-1.5 text-xs sm:text-sm rounded-full transition " +
                (visibility === "public"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-200")
              }
              disabled={isSubmitting}
            >
              Public (vitrine)
            </button>
            <button
              type="button"
              onClick={() => onChange({ visibility: "private" })}
              className={
                "px-4 sm:px-5 py-1.5 text-xs sm:text-sm rounded-full transition " +
                (visibility === "private"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-200")
              }
              disabled={isSubmitting}
            >
              Réservé aux membres
            </button>
          </div>

          {visibility === "public" ? (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              La page publique de la formation sera visible par tout le monde.
              L’accès au contenu reste contrôlé par l’inscription/paiement.
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              La formation ne sera visible que pour les membres abonnés à la
              communauté. Les visiteurs extérieurs ne verront pas cette
              formation dans ta vitrine.
            </p>
          )}
        </div>

        {/* Type de tarif */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Type de tarif</label>
          <div className="inline-flex rounded-full bg-slate-100/80 dark:bg-slate-800/80 p-1 ring-1 ring-slate-200/70 dark:ring-slate-700/70">
            <button
              type="button"
              onClick={toFree}
              className={
                "px-4 sm:px-5 py-1.5 text-xs sm:text-sm rounded-full transition " +
                (data.priceType === "free" || !data.priceType
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-200")
              }
              disabled={isSubmitting}
            >
              Gratuit
            </button>
            <button
              type="button"
              onClick={toPaid}
              className={
                "px-4 sm:px-5 py-1.5 text-xs sm:text-sm rounded-full transition " +
                (data.priceType === "paid"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-200")
              }
              disabled={isSubmitting}
            >
              Payant
            </button>
          </div>
        </div>

        {/* Bloc gratuit */}
        {!isPaid && (
          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-4 py-3 text-xs sm:text-sm text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-100 space-y-1.5">
            <p className="font-medium">Formation gratuite</p>
            <p>
              Les étudiants pourront accéder à tout le contenu sans paiement.
              Aucun frais de plateforme n’est affiché ici.
            </p>
          </div>
        )}

        {/* Partie payante */}
        {isPaid && (
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.9fr)] items-start">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Devise</label>
                <select
                  value={data.currency ?? "USD"}
                  onChange={handleCurrencyChange}
                  className="w-full rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 ring-1 outline-none ring-slate-200 dark:ring-slate-700 text-sm"
                  disabled={isSubmitting}
                >
                  <option value="USD">USD ($)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium">
                  Prix ({data.currency ?? "USD"})
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    $
                  </span>
                  <input
                    type="number"
                    min={MIN_PRICE}
                    step="0.01"
                    inputMode="decimal"
                    value={Number.isFinite(price) ? price : ""}
                    onChange={handlePriceChange}
                    className="w-full pl-7 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 ring-1 outline-none ring-slate-200 dark:ring-slate-700 text-sm"
                    aria-invalid={!priceIsValid}
                    aria-describedby="price-help"
                    disabled={isSubmitting}
                  />
                </div>
                {!priceIsValid ? (
                  <p className="text-xs text-red-500">
                    Le prix minimum est de ${MIN_PRICE.toFixed(2)}.
                  </p>
                ) : (
                  <p id="price-help" className="text-xs text-slate-500">
                    Minimum accepté : <strong>${MIN_PRICE.toFixed(2)}</strong>
                  </p>
                )}
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200/90 bg-slate-50/90 px-4 py-3 sm:px-5 sm:py-4 text-sm shadow-sm dark:border-slate-700/80 dark:bg-slate-900/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">
                  Prix public
                </span>
                <span className="font-semibold">
                  ${Number.isFinite(price) ? price.toFixed(2) : "0.00"}
                </span>
              </div>
            </aside>
          </div>
        )}

        {/* ✅ mini progression dans l'étape (en plus de la barre globale en bas) */}
        {isSubmitting && (
          <div className="rounded-2xl border border-violet-500/25 bg-violet-500/10 p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span className="truncate">
                    {submitStage ?? "Envoi des fichiers…"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Ne ferme pas la page pendant l’envoi.
                </p>
              </div>

              {percent !== null && (
                <div className="shrink-0 text-xs font-semibold text-slate-900 dark:text-slate-50">
                  {percent}%
                </div>
              )}
            </div>

            <div className="mt-3 h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-violet-600 transition-[width] duration-200"
                style={{
                  width: `${percent ?? 18}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Bouton final */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={buttonDisabled}
            aria-busy={isSubmitting}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-violet-600 text-sm sm:text-base font-medium text-white shadow-sm
                      hover:bg-violet-700 active:scale-[0.98]
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            title={
              priceIsValid
                ? isEdit
                  ? "Mettre à jour la formation"
                  : "Créer la formation"
                : "Prix trop bas pour valider"
            }
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            <span>{buttonLabel}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
