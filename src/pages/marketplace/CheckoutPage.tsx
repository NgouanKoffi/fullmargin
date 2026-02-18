// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\CheckoutPage.tsx
import { useNavigate } from "react-router-dom";
import PaymentMethodModal, {
  type PaymentMethod as ModalPaymentMethod,
} from "../../components/payment/PaymentMethodModal";
import CheckoutOrderSummary from "./components/CheckoutOrderSummary";
import { useMarketplaceCheckout } from "./hooks/useMarketplaceCheckout";

const openAuth = (mode: "signin" | "signup" = "signin") =>
  window.dispatchEvent(
    new CustomEvent("fm:open-account", { detail: { mode } }),
  );

function CheckoutPageSkeleton({
  title,
}: {
  title: "Paiement" | "Renouvellement";
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 lg:px-6 pb-16">
      <h2 className="text-xl font-bold mb-4">{title}</h2>

      <div className="grid gap-6">
        <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 p-4 md:p-5">
          <div className="h-4 w-40 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="h-3 w-4/6 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
          <div className="mt-5 h-10 w-full rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>

        <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 p-4 md:p-5">
          <div className="h-4 w-56 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="mt-3 h-16 w-full rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="mt-4 grid grid-cols-1 gap-2 max-w-sm mx-auto w-full">
            <div className="h-10 w-full rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="h-10 w-full rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="h-11 w-full rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();

  const {
    isLoggedIn,
    lines,
    loading,
    firstLoadDone,
    ownedIds,
    ownedTitles,
    promoMap,
    subtotal,
    isFreeOrder,
    error,
    placing,
    stripeReady,
    hasSelfBuy,
    disabledForPayment,
    paymentModalOpen,
    openPaymentModal,
    closePaymentModal,
    paymentLoadingMethod,
    handleFreeOrder,
    handlePayCard,
    handlePayCrypto,
    isRenewCheckout,
    renewProductId,
    cryptoEligible,
  } = useMarketplaceCheckout();

  const goToOrders = () => navigate("/marketplace/dashboard?tab=orders");
  const goToShop = () => navigate("/marketplace?cat=produits");

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-3xl px-4 lg:px-6">
        <h2 className="text-xl font-bold mb-3">
          {isRenewCheckout ? "Renouvellement" : "Paiement"}
        </h2>

        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 max-[440px]:flex-col max-[440px]:items-stretch">
          <div className="text-sm opacity-80">
            Connectez-vous pour finaliser{" "}
            {isRenewCheckout ? "le renouvellement" : "votre achat"}.
          </div>
          <button
            onClick={() => openAuth("signin")}
            className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 max-[440px]:w-full max-[440px]:mt-2"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  const pageReady =
    firstLoadDone && !loading && (isRenewCheckout ? !!renewProductId : true);

  if (!pageReady) {
    return (
      <CheckoutPageSkeleton
        title={isRenewCheckout ? "Renouvellement" : "Paiement"}
      />
    );
  }

  if (
    firstLoadDone &&
    (lines.length === 0 || !renewProductId) &&
    isRenewCheckout
  ) {
    return (
      <div className="mx-auto max-w-3xl px-4 lg:px-6">
        <h2 className="text-xl font-bold mb-3">Renouvellement</h2>

        <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center">
          <div className="text-lg font-semibold mb-1">
            Renouvellement indisponible
          </div>
          <div className="text-sm opacity-70">
            {error
              ? error
              : "Impossible de charger le produit à renouveler. Vérifie que le lien contient bien ?renew=1&product=<id>."}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 max-w-sm mx-auto">
            <button
              type="button"
              onClick={goToOrders}
              className="w-full rounded-xl px-4 py-2 text-sm ring-1 ring-black/10 dark:ring-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              Retour à mes achats
            </button>
            <button
              type="button"
              onClick={goToShop}
              className="w-full rounded-xl px-4 py-2 text-sm ring-1 ring-black/10 dark:ring-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              Continuer mes achats
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (firstLoadDone && lines.length === 0 && !isRenewCheckout) {
    return (
      <div className="mx-auto max-w-3xl px-4 lg:px-6">
        <h2 className="text-xl font-bold mb-3">Paiement</h2>
        <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center">
          <div className="text-lg font-semibold mb-1">
            Votre sélection est vide
          </div>
          <div className="text-sm opacity-70">
            Ajoutez des produits ou utilisez “Acheter” pour lancer un paiement
            direct.
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => navigate("/marketplace/dashboard?tab=cart")}
              className="w-full rounded-xl px-4 py-2 text-sm ring-1 ring-black/10 dark:ring-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              Retour au panier
            </button>
            <button
              type="button"
              onClick={goToShop}
              className="w-full rounded-xl px-4 py-2 text-sm ring-1 ring-black/10 dark:ring-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              Continuer mes achats
            </button>
          </div>
        </div>
      </div>
    );
  }

  const primaryDisabled = disabledForPayment;

  const modalLoadingMethod: ModalPaymentMethod =
    paymentLoadingMethod === "card" || paymentLoadingMethod === "crypto"
      ? paymentLoadingMethod
      : null;

  const selfBuyTooltip =
    ownedTitles.length > 0
      ? `Impossible d’acheter votre produit car vous en êtes l’auteur : ${ownedTitles.join(
          ", ",
        )}.`
      : "Impossible d’acheter votre produit car vous en êtes l’auteur.";

  const primaryTitle = hasSelfBuy ? selfBuyTooltip : undefined;

  const primaryLabel = placing
    ? isFreeOrder
      ? "Validation en cours…"
      : !cryptoEligible
        ? "Ouverture du paiement…"
        : "Préparation du paiement…"
    : hasSelfBuy
      ? "Produit déjà à vous"
      : isFreeOrder
        ? "Valider la commande (0 $)"
        : !cryptoEligible
          ? "Acheter"
          : "Choisir le moyen de paiement";

  return (
    <div className="mx-auto max-w-3xl px-4 lg:px-6 pb-16">
      <h2 className="text-xl font-bold mb-4">
        {isRenewCheckout ? "Renouvellement" : "Paiement"}
      </h2>

      <div className="grid gap-6">
        <CheckoutOrderSummary
          lines={lines}
          loading={loading}
          ownedIds={ownedIds}
          ownedTitles={ownedTitles}
          promoMap={promoMap}
          subtotal={subtotal}
          error={error}
        />

        <section className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 p-4 md:p-5">
          <div className="text-base font-semibold mb-2">
            {isFreeOrder ? "Validation" : "Moyen de paiement"}
          </div>

          <div className="rounded-xl border border-dashed border-black/15 dark:border-white/15 p-4 text-sm opacity-80">
            {isFreeOrder
              ? "Le montant total de votre commande est de 0 $. Aucune information de paiement ne sera demandée : validez simplement pour obtenir l’accès."
              : stripeReady
                ? cryptoEligible
                  ? "Choisissez carte ou crypto."
                  : "Paiement par carte bancaire."
                : cryptoEligible
                  ? "Carte en initialisation… (Crypto reste disponible)."
                  : "Carte en initialisation…"}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 max-w-sm mx-auto w-full">
            {!isRenewCheckout ? (
              <button
                type="button"
                onClick={() => navigate("/marketplace/dashboard?tab=cart")}
                className="w-full rounded-xl px-4 py-2 text-sm ring-1 ring-black/10 dark:ring-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Retour au panier
              </button>
            ) : (
              <button
                type="button"
                onClick={goToOrders}
                className="w-full rounded-xl px-4 py-2 text-sm ring-1 ring-black/10 dark:ring-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Retour à mes achats
              </button>
            )}

            <button
              type="button"
              onClick={goToShop}
              className="w-full rounded-xl px-4 py-2 text-sm ring-1 ring-black/10 dark:ring-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              Continuer mes achats
            </button>

            <button
              type="button"
              disabled={primaryDisabled}
              onClick={() => {
                if (isFreeOrder) {
                  void handleFreeOrder();
                  return;
                }

                if (!cryptoEligible) {
                  void handlePayCard();
                  return;
                }

                openPaymentModal();
              }}
              className={`w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-white ${
                primaryDisabled
                  ? "bg-violet-400 cursor-not-allowed"
                  : "bg-violet-600 hover:bg-violet-700"
              }`}
              title={primaryTitle}
            >
              {primaryLabel}
            </button>

            {hasSelfBuy ? (
              <div className="mt-2 text-center text-xs text-amber-700 dark:text-amber-300">
                Impossible d’acheter votre produit car vous en êtes l’auteur.
                Rendez-vous dans votre tableau de bord Marketplace pour le
                gérer.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <PaymentMethodModal
        open={isFreeOrder ? false : cryptoEligible ? paymentModalOpen : false}
        onClose={closePaymentModal}
        // ✅ IMPORTANT: on laisse handlePayCard gérer stripeReady (sinon “rien ne se passe”)
        onCard={() => {
          void handlePayCard();
        }}
        onSubmitCrypto={(network) => {
          void handlePayCrypto(network);
        }}
        loadingMethod={modalLoadingMethod}
        disabled={placing || hasSelfBuy || isFreeOrder}
        cryptoAvailable={cryptoEligible}
      />
    </div>
  );
}
